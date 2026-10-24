const S = 72; // node size
const Y = 70; // node row top

type Step = { label: string; sub: string; icon: React.ReactNode };

const STEPS: Step[] = [
  { label: "Submit workflow", sub: "Upload your n8n JSON", icon: <path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /> },
  { label: "Place a bid", sub: "Pick your position", icon: <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
  { label: "Rank up", sub: "Climb the leaderboard", icon: <path d="M12 19V5M5 12l7-7 7 7" /> },
  { label: "Get seen", sub: "Builders find your work", icon: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></> },
];

const xOf = (i: number) => 30 + i * 200;
const cy = Y + S / 2;
const BID = 1; // index of "Place a bid"
const RANK = 2; // index of "Rank up"

const edge = (x1: number, x2: number) => `M${x1} ${cy} C${(x1 + x2) / 2} ${cy}, ${(x1 + x2) / 2} ${cy}, ${x2} ${cy}`;
// "Outbid?" loop: from the top of "Rank up" back over to the top of "Place a bid"
const LOOP = `M${xOf(RANK) + S / 2} ${Y} C${xOf(RANK) + S / 2} ${Y - 60}, ${xOf(BID) + S / 2} ${Y - 60}, ${xOf(BID) + S / 2} ${Y - 6}`;

// One execution every 5s; each segment lights up in turn: [path, start, end] as fractions of the cycle.
const PACKETS: [string, number, number][] = [
  ...STEPS.slice(1).map((_, i): [string, number, number] => [edge(xOf(i) + S, xOf(i + 1)), 0.02 + i * 0.2, 0.16 + i * 0.2]),
  [LOOP, 0.64, 0.82],
];

const trigger = (x: number) =>
  `M${x + 36} ${Y} H${x + S - 12} Q${x + S} ${Y} ${x + S} ${Y + 12} V${Y + S - 12} Q${x + S} ${Y + S} ${x + S - 12} ${Y + S} H${x + 36} A36 36 0 0 1 ${x + 36} ${Y} Z`;

function Icon({ children, x, y, size }: { children: React.ReactNode; x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  );
}

function Diagram() {
  return (
    <svg viewBox="0 0 732 200" className="h-auto w-full text-white" role="img"
      aria-label="How n8n Rank works: submit your workflow, place a bid, rank up and get seen. If someone outbids you, raise your bid to climb again.">
      <defs>
        <marker id="hiw-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="rgba(255,255,255,0.6)" />
        </marker>
      </defs>

      {STEPS.slice(1).map((_, i) => (
        <path key={i} d={edge(xOf(i) + S, xOf(i + 1))} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      ))}
      <path d={LOOP} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" className="flow-dash" markerEnd="url(#hiw-arrow)" />
      <text x={(xOf(BID) + xOf(RANK)) / 2 + S / 2} y="18" textAnchor="middle" className="fill-white/60 text-[11px]">Outbid? Raise your bid</text>

      {PACKETS.map(([d, s, e], i) => (
        <circle key={i} r="4.5" fill="#fff" opacity="0" className="motion-reduce:hidden">
          <animateMotion dur="5s" repeatCount="indefinite" path={d} keyPoints="0;0;1;1" keyTimes={`0;${s};${e};1`} calcMode="linear" />
          <animate attributeName="opacity" dur="5s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={`0;${s};${s + 0.01};${e - 0.01};${e};1`} />
        </circle>
      ))}

      {STEPS.map((step, i) => {
        const x = xOf(i);
        const last = i === STEPS.length - 1;
        return (
          <g key={step.label}>
            {i === 0 ? (
              <path d={trigger(x)} fill="#0a0a0a" stroke="#fff" strokeWidth="1.5" />
            ) : (
              <>
                <rect x={x} y={Y} width={S} height={S} rx="12" fill="#0a0a0a" stroke="#fff" strokeWidth="1.5" />
                <rect x={x - 3} y={cy - 7} width="6" height="14" rx="2" fill="#fff" />
              </>
            )}
            {!last && <circle cx={x + S} cy={cy} r="5" fill="#fff" />}
            <Icon x={x + S / 2} y={cy} size={28}>{step.icon}</Icon>
            <circle cx={x + S - 4} cy={Y + 4} r="9" fill="#fff" />
            <text x={x + S - 4} y={Y + 8} textAnchor="middle" className="fill-black text-[11px] font-extrabold">{i + 1}</text>
            <text x={x + S / 2} y={Y + S + 20} textAnchor="middle" className="fill-white text-[13px] font-bold">{step.label}</text>
            <text x={x + S / 2} y={Y + S + 36} textAnchor="middle" className="fill-white/50 text-[11px]">{step.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black text-left">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-white/40">n8n rank /</span>
          <span className="truncate font-semibold">How it works</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-white/60">
          <span>Active</span>
          <span className="relative h-4 w-7 rounded-full bg-white">
            <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-black" />
          </span>
        </div>
      </div>

      <div className="canvas-grid px-4 py-6 sm:px-6 sm:py-8 lg:px-5">
        <div className="hidden sm:block"><Diagram /></div>

        {/* phone layout: full-width node cards joined by connectors; each card lights up as the run reaches it */}
        <ol className="flex flex-col sm:hidden">
          {STEPS.map((step, i) => (
            <li key={step.label}>
              <div className="hiw-node flex items-center gap-3.5 rounded-2xl border border-border bg-black/90 p-3"
                style={{ animationDelay: `${i === 0 ? 0 : i - 0.2}s` }}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center border border-white bg-[#0a0a0a] ${i === 0 ? "rounded-l-full rounded-r-xl" : "rounded-xl"}`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{step.icon}</svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{step.label}</p>
                  <p className="text-xs text-muted">{step.sub}</p>
                </div>
                <span className="font-mono text-2xl font-extrabold text-white/15" aria-hidden>0{i + 1}</span>
              </div>

              {i < STEPS.length - 1 && (
                <div className="flex h-8 items-center gap-3 pl-[33px]" aria-hidden={step.label !== "Rank up"}>
                  <span className="relative h-full w-0.5 shrink-0 bg-white/40">
                    <span className="hiw-dot" style={{ animationDelay: `${0.1 + i}s` }} />
                  </span>
                  {step.label === "Rank up" && (
                    <span className="hiw-loop rounded-full border border-dashed border-white/50 px-2.5 py-0.5 text-[11px] text-white/80">
                      ↺ Outbid? Raise your bid
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
