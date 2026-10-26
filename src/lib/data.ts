import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type Workflow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  clicks: number;
  nodes: number;
  age: string;
  bid: number; // highest bid in dollars, 0 = no bids yet
  imageUrl: string | null;
  apps: string[]; // apps/nodes used, for search
  created: string; // ISO date, for "Newest" sorting
};

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  click_count: number;
  node_count: number;
  image_path: string | null;
  created_at: string;
  apps?: string[];
  bids: { amount_cents: number }[];
};

const ago = (iso: string) => {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const units: [string, number][] = [["month", 43200], ["week", 10080], ["day", 1440], ["hour", 60], ["minute", 1]];
  for (const [name, size] of units) {
    if (mins >= size) {
      const n = Math.floor(mins / size);
      return `${n} ${name}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
};

/** Published workflows, ranked by highest bid, then clicks, then newest. */
export async function getWorkflows(): Promise<Workflow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("workflows");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const cols = "id, slug, title, description, category, click_count, node_count, image_path, created_at, bids(amount_cents)";
  // A page at a time (newest first, so the order is stable), so a long list is never cut off. Ranking happens below.
  const PAGE = 1000;
  const MAX_ROWS = 20000;
  const loadAll = async (select: string) => {
    const rows: Row[] = [];
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
      const res = await supabase.from("workflows").select(select).eq("status", "published")
        .order("created_at", { ascending: false }).order("id").range(from, from + PAGE - 1)
        .overrideTypes<Row[], { merge: false }>();
      if (res.error || !res.data) return { data: null, error: res.error };
      rows.push(...res.data);
      if (res.data.length < PAGE) break;
    }
    return { data: rows, error: null };
  };

  let { data, error } = await loadAll(`${cols}, apps`);
  if (error) ({ data, error } = await loadAll(cols)); // `apps` column not migrated yet: still show the list

  if (error || !data) {
    console.error("getWorkflows failed:", error?.message);
    return [];
  }

  return data
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      clicks: r.click_count,
      nodes: r.node_count,
      age: ago(r.created_at),
      bid: Math.max(0, ...r.bids.map((b) => b.amount_cents)) / 100,
      imageUrl: r.image_path ? `${url}/storage/v1/object/public/workflow-images/${r.image_path}` : null,
      apps: r.apps ?? [],
      created: r.created_at,
    }))
    .sort((a, b) => b.bid - a.bid || b.clicks - a.clicks || b.created.localeCompare(a.created));
}

/** Diagram-only view of a workflow: names, types, positions and links. No parameters, credentials or code. */
export type WorkflowGraph = { nodes: Record<string, unknown>[]; connections: Record<string, unknown> };

export type WorkflowDetail = Workflow & { graph: WorkflowGraph; author: string | null; buyUrl: string | null };

/** Strips everything the canvas drawing does not need, so the real workflow never leaves the server. */
function toGraph(json: unknown): WorkflowGraph {
  const wf = (json ?? {}) as { nodes?: unknown; connections?: unknown };
  const nodes = (Array.isArray(wf.nodes) ? wf.nodes : []).flatMap((n: Record<string, unknown> | null) => {
    if (!n || typeof n.name !== "string" || typeof n.type !== "string") return [];
    const node: Record<string, unknown> = { name: n.name, type: n.type, position: n.position, disabled: n.disabled === true };
    if (n.type.endsWith(".stickyNote")) {
      const p = (n.parameters ?? {}) as Record<string, unknown>;
      const content = typeof p.content === "string" ? p.content.replace(/[#*_`>]/g, "").trim().split("\n")[0].slice(0, 60) : "";
      node.parameters = { content, width: p.width, height: p.height };
    }
    return [node];
  });
  const connections: Record<string, unknown> = {};
  for (const [from, byType] of Object.entries((wf.connections ?? {}) as Record<string, Record<string, unknown>>)) {
    connections[from] = {};
    for (const [type, groups] of Object.entries(byType ?? {})) {
      (connections[from] as Record<string, unknown>)[type] = Array.isArray(groups)
        ? groups.map((branch) => (Array.isArray(branch) ? branch.map((l: { node?: unknown } | null) => ({ node: l?.node })) : branch))
        : [];
    }
  }
  return { nodes, connections };
}

/**
 * One published workflow by slug (for the details page). Server only: it reads workflow_json with the
 * service-role key, because the public key is not allowed to read that column. Only a stripped
 * diagram graph is returned, never the real JSON.
 */
export async function getWorkflow(slug: string): Promise<WorkflowDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("workflows", `workflow:${slug}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: r, error } = await supabase
    .from("workflows")
    .select("id, slug, title, description, category, click_count, node_count, image_path, created_at, author_name, workflow_json, buy_url, bids(amount_cents)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
    .overrideTypes<Row & { author_name: string | null; workflow_json: unknown; buy_url: string | null }, { merge: false }>();

  if (error) console.error("getWorkflow failed:", error.message);
  if (!r) return null;

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    clicks: r.click_count,
    nodes: r.node_count,
    age: ago(r.created_at),
    bid: Math.max(0, ...r.bids.map((b) => b.amount_cents)) / 100,
    imageUrl: r.image_path ? `${url}/storage/v1/object/public/workflow-images/${r.image_path}` : null,
    apps: [],
    created: r.created_at,
    author: r.author_name,
    graph: toGraph(r.workflow_json),
    buyUrl: r.buy_url,
  };
}
