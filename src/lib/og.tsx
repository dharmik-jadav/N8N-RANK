import { ImageResponse } from "next/og";
import { parseWorkflow } from "@/components/WorkflowDiagram";
import type { WorkflowDetail } from "@/lib/data";

export const OG_SIZE = { width: 1200, height: 630 };

const BOX = { w: 500, h: 330 };
const INSET = 8; // keeps node outlines from being clipped by the svg edge

/** 1200x630 share card: logo, rank, title and a miniature of the real canvas layout. `rank` 0 = unknown. */
export function workflowOg(w: WorkflowDetail | null, rank: number, logo: string) {
  const title = w?.title ?? "n8n workflow";

  // Shrink the real canvas layout into a fixed box.
  const graph = w ? parseWorkflow(w.graph) : { nodes: [], edges: [] };
  const nodes = graph.nodes.filter((n) => n.kind !== "sticky");
  const minX = Math.min(...nodes.map((n) => n.x), 0);
  const minY = Math.min(...nodes.map((n) => n.y), 0);
  const spanX = Math.max(...nodes.map((n) => n.x + n.w), 1) - minX;
  const spanY = Math.max(...nodes.map((n) => n.y + 100), 1) - minY;
  const k = Math.min((BOX.w - INSET * 2) / spanX, (BOX.h - INSET * 2) / spanY, 1);
  const at = (n: (typeof nodes)[number]) => ({
    x: (n.x - minX) * k + (BOX.w - spanX * k) / 2,
    y: (n.y - minY) * k + (BOX.h - spanY * k) / 2,
    w: n.w * k,
    h: 100 * k,
  });
  const byName = new Map(nodes.map((n) => [n.name, n]));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#000", color: "#fff", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" height={44} width={204} />
          {w && (
            <div style={{ display: "flex", fontSize: 28, border: "2px solid #fff", borderRadius: 999, padding: "8px 24px" }}>
              {w.bid > 0 ? `Top bid $${w.bid}` : "Open position"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {rank > 0 && <div style={{ display: "flex", fontSize: 96, fontWeight: 800, lineHeight: 1, opacity: 0.9 }}>#{rank}</div>}
            <div style={{ display: "flex", fontSize: title.length > 70 ? 40 : title.length > 40 ? 48 : 58, fontWeight: 800, lineHeight: 1.1, marginTop: 20 }}>
              {title.length > 90 ? `${title.slice(0, 89)}…` : title}
            </div>
            {w && <div style={{ display: "flex", fontSize: 24, opacity: 0.6, marginTop: 18 }}>{`${w.category} · ${w.nodes} nodes`}</div>}
          </div>

          {nodes.length > 0 && (
            <svg width={BOX.w} height={BOX.h} viewBox={`0 0 ${BOX.w} ${BOX.h}`}>
              {graph.edges
                .filter((e) => e.type === "main" && byName.has(e.from) && byName.has(e.to))
                .map((e, i) => {
                  const a = at(byName.get(e.from)!);
                  const b = at(byName.get(e.to)!);
                  return <line key={i} x1={a.x + a.w} y1={a.y + a.h / 2} x2={b.x} y2={b.y + b.h / 2} stroke="#fff" strokeOpacity="0.5" strokeWidth="3" />;
                })}
              {nodes.map((n, i) => {
                const p = at(n);
                return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={Math.max(6, p.h / 6)} fill="#0a0a0a" stroke="#fff" strokeWidth="3" />;
              })}
            </svg>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 22, opacity: 0.5, marginTop: 8 }}>The leaderboard for n8n workflows</div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
