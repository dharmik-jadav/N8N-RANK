export const MAX_WORKFLOW_BYTES = 1_000_000;

export type WorkflowCheck =
  | { ok: true; nodeCount: number; json: Record<string, unknown> }
  | { ok: false; error: string };

const fail = (error: string): WorkflowCheck => ({ ok: false, error: `Invalid workflow JSON: ${error}` });

export const isTrigger = (type: string) =>
  /trigger$/i.test(type) || /\.(webhook|start|formTrigger|manualTrigger|cron|interval)$/i.test(type);

/** Validates the structure of an exported n8n workflow. Used on the client and again on the server. */
export function validateWorkflow(raw: string): WorkflowCheck {
  if (new Blob([raw]).size > MAX_WORKFLOW_BYTES) return fail("file is larger than 1 MB");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return fail(`not valid JSON (${e instanceof Error ? e.message : "parse error"})`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return fail("expected a JSON object at the top level");
  }

  const wf = data as Record<string, unknown>;
  if (!("nodes" in wf) || !("connections" in wf)) return fail('missing "nodes" or "connections"');
  if (!Array.isArray(wf.nodes)) return fail('"nodes" must be an array');
  if (wf.nodes.length === 0) return fail('"nodes" is empty');
  if (typeof wf.connections !== "object" || wf.connections === null || Array.isArray(wf.connections)) {
    return fail('"connections" must be an object');
  }

  const names = new Set<string>();
  let hasTrigger = false;
  for (const [i, n] of wf.nodes.entries()) {
    const node = n as Record<string, unknown> | null;
    if (typeof node !== "object" || node === null) return fail(`node #${i + 1} is not an object`);
    if (typeof node.name !== "string" || !node.name) return fail(`node #${i + 1} is missing "name"`);
    if (typeof node.type !== "string" || !node.type) return fail(`node "${node.name}" is missing "type"`);
    const pos = node.position;
    if (!Array.isArray(pos) || pos.length !== 2 || !pos.every((v) => typeof v === "number")) {
      return fail(`node "${node.name}" has an invalid "position" (expected [x, y])`);
    }
    if (names.has(node.name)) return fail(`duplicate node name "${node.name}"`);
    names.add(node.name);
    if (isTrigger(node.type)) hasTrigger = true;
  }
  if (!hasTrigger) return fail("no trigger node found (add a Webhook, Schedule or other trigger)");

  for (const [source, outputs] of Object.entries(wf.connections as Record<string, unknown>)) {
    if (!names.has(source)) return fail(`connection references unknown node "${source}"`);
    for (const group of Object.values((outputs ?? {}) as Record<string, unknown>)) {
      if (!Array.isArray(group)) continue;
      for (const branch of group) {
        if (!Array.isArray(branch)) continue;
        for (const link of branch) {
          const target = (link as { node?: unknown } | null)?.node;
          if (typeof target !== "string" || !names.has(target)) {
            return fail(`"${source}" connects to unknown node "${String(target)}"`);
          }
        }
      }
    }
  }

  return { ok: true, nodeCount: wf.nodes.length, json: wf };
}
