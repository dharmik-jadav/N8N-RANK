import { isTrigger } from "@/lib/validateWorkflow";

/**
 * Draws an exported n8n workflow (its "nodes" + "connections") as an n8n-style canvas.
 * Pure SVG, no hooks, so it renders on the server (details page) and in the client (submit preview).
 */

const H = 100; // n8n's default node size
const WIDE = 200; // nodes with AI sub-nodes attached (e.g. AI Agent) are drawn wider, like in n8n
const SUB_R = 40; // sub-nodes (models, memory, tools) are circles

type Node = {
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  kind: "trigger" | "node" | "sub" | "sticky";
  disabled: boolean;
  outputs: number;
  subPorts: string[];
  note?: { w: number; h: number; text: string };
};
type Edge = { from: string; to: string; output: number; type: string };

const PORT_LABELS: Record<string, string> = {
  ai_languageModel: "Model", ai_memory: "Memory", ai_tool: "Tool", ai_outputParser: "Output Parser",
  ai_embedding: "Embeddings", ai_vectorStore: "Vector Store", ai_document: "Document",
  ai_textSplitter: "Text Splitter", ai_retriever: "Retriever",
};
const portLabel = (t: string) => PORT_LABELS[t] ?? t.replace(/^ai_/, "");

const shortType = (type: string) => type.split(".").pop() ?? type;

/** "n8n-nodes-base.httpRequest" -> "Http Request", "@n8n/...lmChatOpenAi" -> "Lm Chat Open Ai" */
export const prettyType = (type: string) =>
  shortType(type).replace(/Trigger$/, " Trigger").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()).trim();

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

export function parseWorkflow(json: unknown): { nodes: Node[]; edges: Edge[] } {
  const wf = (json ?? {}) as { nodes?: unknown; connections?: unknown };
  const rawNodes = Array.isArray(wf.nodes) ? (wf.nodes as Record<string, unknown>[]) : [];
  const conns = (wf.connections && typeof wf.connections === "object" ? wf.connections : {}) as Record<string, Record<string, unknown>>;

  const edges: Edge[] = [];
  const outputs = new Map<string, number>();
  const subSources = new Set<string>();
  const subPorts = new Map<string, string[]>();

  for (const [from, byType] of Object.entries(conns)) {
    for (const [type, groups] of Object.entries(byType ?? {})) {
      if (!Array.isArray(groups)) continue;
      if (type === "main") outputs.set(from, Math.max(outputs.get(from) ?? 1, groups.length));
      groups.forEach((branch, output) => {
        if (!Array.isArray(branch)) return;
        for (const link of branch) {
          const to = (link as { node?: unknown } | null)?.node;
          if (typeof to !== "string") continue;
          edges.push({ from, to, output, type });
          if (type !== "main") {
            subSources.add(from);
            const ports = subPorts.get(to) ?? [];
            if (!ports.includes(type)) subPorts.set(to, [...ports, type]);
          }
        }
      });
    }
  }

  const nodes: Node[] = [];
  for (const n of rawNodes) {
    if (!n || typeof n.name !== "string" || typeof n.type !== "string") continue;
    const pos = Array.isArray(n.position) ? n.position : [];
    const base = { name: n.name, type: n.type, x: num(pos[0], 0), y: num(pos[1], 0), disabled: n.disabled === true, outputs: outputs.get(n.name) ?? 1, subPorts: subPorts.get(n.name) ?? [] };
    if (n.type.endsWith(".stickyNote")) {
      const p = (n.parameters ?? {}) as Record<string, unknown>;
      const text = typeof p.content === "string" ? p.content.replace(/[#*_`>]/g, "").trim().split("\n")[0].slice(0, 60) : "";
      nodes.push({ ...base, w: num(p.width, 240), kind: "sticky", note: { w: num(p.width, 240), h: num(p.height, 160), text } });
    } else if (subSources.has(n.name)) {
      nodes.push({ ...base, w: SUB_R * 2, kind: "sub" });
    } else {
      nodes.push({ ...base, w: base.subPorts.length ? WIDE : H, kind: isTrigger(n.type) ? "trigger" : "node" });
    }
  }
  return { nodes, edges };
}

// --- icons -----------------------------------------------------------------------

const P = {
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  play: <path d="M7 4v16l13-8z" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  form: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  bot: <><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M9 13v2M15 13v2" /></>,
  spark: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
  db: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  split: <><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M6 3v12M18 9a9 9 0 0 1-9 9" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  merge: <path d="M8 6l4-4 4 4M12 2v8a6 6 0 0 1-6 6H4M12 10a6 6 0 0 0 6 6h2" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></>,
};

const ICON_RULES: [RegExp, keyof typeof P][] = [
  [/webhook/i, "bolt"], [/schedule|cron|interval/i, "clock"], [/manualtrigger|^start$/i, "play"],
  [/chattrigger/i, "chat"], [/form/i, "form"], [/agent/i, "bot"], [/memory|vectorstore|postgres|mysql|supabase|redis|mongo/i, "db"],
  [/lmchat|openai|anthropic|gemini|ollama|mistral|embeddings|chain/i, "spark"], [/tool/i, "tool"],
  [/^(if|switch|filter)$/i, "split"], [/httprequest/i, "globe"], [/code|function/i, "code"], [/^set$/i, "pen"],
  [/merge/i, "merge"], [/gmail|email|mail|outlook/i, "mail"], [/slack|discord|telegram|whatsapp|teams/i, "chat"],
  [/sheets|airtable|spreadsheet|excel|notion/i, "grid"], [/wait/i, "clock"],
];

function NodeIcon({ type, cx, cy, size }: { type: string; cx: number; cy: number; size: number }) {
  const t = shortType(type);
  const key = ICON_RULES.find(([re]) => re.test(t))?.[1];
  if (!key) {
    return <text x={cx} y={cy + size * 0.32} textAnchor="middle" fill="currentColor" fontSize={size * 0.9} fontWeight="800">{t.charAt(0).toUpperCase()}</text>;
  }
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 24})`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {P[key]}
    </g>
  );
}

// --- geometry ----------------------------------------------------------------------

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = Math.max(50, Math.abs(x2 - x1) / 2);
  return `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

const outPort = (n: Node, i: number) => ({ x: n.x + n.w, y: n.y + (H * (i + 1)) / (n.outputs + 1) });
const subPortX = (n: Node, type: string) => n.x + (n.w * (n.subPorts.indexOf(type) + 1)) / (n.subPorts.length + 1);

const triggerPath = ({ x, y, w }: Node) =>
  `M${x + H / 2} ${y} H${x + w - 14} Q${x + w} ${y} ${x + w} ${y + 14} V${y + H - 14} Q${x + w} ${y + H} ${x + w - 14} ${y + H} H${x + H / 2} A${H / 2} ${H / 2} 0 0 1 ${x + H / 2} ${y} Z`;

export default function WorkflowDiagram({ json, title, compact = false }: { json: unknown; title?: string; compact?: boolean }) {
  const { nodes, edges } = parseWorkflow(json);
  const byName = new Map(nodes.map((n) => [n.name, n]));
  const real = nodes.filter((n) => n.kind !== "sticky");

  if (real.length === 0) return null;

  const pad = 60;
  const boxes = nodes.map((n) => (n.note ? [n.x, n.y, n.x + n.note.w, n.y + n.note.h] : [n.x, n.y, n.x + n.w, n.y + (n.kind === "sub" ? SUB_R * 2 : H) + 44]));
  const minX = Math.min(...boxes.map((b) => b[0])) - pad;
  const minY = Math.min(...boxes.map((b) => b[1])) - pad;
  const width = Math.max(...boxes.map((b) => b[2])) + pad - minX;
  const height = Math.max(...boxes.map((b) => b[3])) + pad - minY;

  const mainEdges = edges.filter((e) => e.type === "main" && byName.has(e.from) && byName.has(e.to));
  const subEdges = edges.filter((e) => e.type !== "main" && byName.has(e.from) && byName.has(e.to));
  const animate = mainEdges.length <= 40;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black text-left">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-white/40">n8n rank /</span>
          <span className="truncate font-semibold">{title || "Workflow preview"}</span>
        </div>
        <span className="shrink-0 text-white/50">{real.length} nodes</span>
      </div>

      <div className={`canvas-grid overflow-auto ${compact ? "max-h-72" : "max-h-[70vh]"}`}>
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="block h-auto w-full text-white"
          style={compact ? undefined : { minWidth: Math.min(Math.round(width * 0.55), 2400) }}
          role="img" aria-label={`n8n workflow with ${real.length} nodes: ${real.map((n) => n.name).join(", ")}`}>

          {/* sticky notes sit behind everything */}
          {nodes.filter((n) => n.note).map((n) => (
            <g key={n.name}>
              <rect x={n.x} y={n.y} width={n.note!.w} height={n.note!.h} rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeDasharray="6 6" />
              {n.note!.text && <text x={n.x + 14} y={n.y + 28} className="fill-white/60 text-[15px] font-semibold">{clip(n.note!.text, Math.floor(n.note!.w / 9))}</text>}
            </g>
          ))}

          {mainEdges.map((e, i) => {
            const a = outPort(byName.get(e.from)!, e.output);
            const b = byName.get(e.to)!;
            return <path key={i} d={curve(a.x, a.y, b.x, b.y + H / 2)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />;
          })}

          {subEdges.map((e, i) => {
            const s = byName.get(e.from)!;
            const t = byName.get(e.to)!;
            const px = subPortX(t, e.type);
            return <path key={i} d={`M${s.x + SUB_R} ${s.y} C${s.x + SUB_R} ${s.y - 40}, ${px} ${t.y + H + 40}, ${px} ${t.y + H}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="flow-dash" />;
          })}

          {animate && mainEdges.map((e, i) => {
            const a = outPort(byName.get(e.from)!, e.output);
            const b = byName.get(e.to)!;
            return (
              <circle key={i} r="5" fill="#fff" className="motion-reduce:hidden">
                <animateMotion dur="2.4s" begin={`${(i % 6) * 0.4}s`} repeatCount="indefinite" path={curve(a.x, a.y, b.x, b.y + H / 2)} />
              </circle>
            );
          })}

          {real.map((n) => {
            const label = <text x={n.x + n.w / 2} y={n.y + (n.kind === "sub" ? SUB_R * 2 : H) + 22} textAnchor="middle" className="fill-white text-[14px] font-semibold">{clip(n.name, n.w > H ? 28 : 18)}</text>;

            if (n.kind === "sub") {
              return (
                <g key={n.name} opacity={n.disabled ? 0.4 : 1}>
                  <circle cx={n.x + SUB_R} cy={n.y + SUB_R} r={SUB_R} fill="#0a0a0a" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                  <NodeIcon type={n.type} cx={n.x + SUB_R} cy={n.y + SUB_R} size={30} />
                  {label}
                </g>
              );
            }

            return (
              <g key={n.name} opacity={n.disabled ? 0.4 : 1}>
                {n.kind === "trigger" ? (
                  <path d={triggerPath(n)} fill="#0a0a0a" stroke="#fff" strokeWidth="2" />
                ) : (
                  <>
                    <rect x={n.x} y={n.y} width={n.w} height={H} rx="14" fill="#0a0a0a" stroke="#fff" strokeWidth="2" />
                    <rect x={n.x - 4} y={n.y + H / 2 - 9} width="8" height="18" rx="2" fill="#fff" />
                  </>
                )}
                {Array.from({ length: n.outputs }, (_, i) => {
                  const p = outPort(n, i);
                  return <circle key={i} cx={p.x} cy={p.y} r="6" fill="#fff" />;
                })}
                {n.subPorts.map((t) => {
                  const px = subPortX(n, t);
                  return (
                    <g key={t}>
                      <rect x={px - 5} y={n.y + H - 5} width="10" height="10" transform={`rotate(45 ${px} ${n.y + H})`} fill="#000" stroke="#fff" strokeWidth="1.5" />
                      <text x={px} y={n.y + H + 22} textAnchor="middle" className="fill-white/50 text-[11px]">{portLabel(t)}</text>
                    </g>
                  );
                })}

                {n.w > H ? (
                  <>
                    <NodeIcon type={n.type} cx={n.x + 40} cy={n.y + H / 2} size={32} />
                    <text x={n.x + 66} y={n.y + H / 2 + 5} className="fill-white text-[15px] font-bold">{clip(n.name, 14)}</text>
                  </>
                ) : (
                  <>
                    <NodeIcon type={n.type} cx={n.x + n.w / 2} cy={n.y + H / 2} size={38} />
                    {label}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
