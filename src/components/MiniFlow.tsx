const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = Math.max(40, (x2 - x1) / 2);
  return `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

/** Small, deterministic workflow diagram used as a card thumbnail. */
export function MiniFlow({ seed, nodes }: { seed: number; nodes: number }) {
  const n = Math.min(5, Math.max(3, Math.round(nodes / 4) + 1));
  const pts = Array.from({ length: n }, (_, i) => {
    const r = ((seed * 9301 + i * 49297 + 233) % 233280) / 233280;
    return { x: 14 + (i * 72) / (n - 1), y: i === 0 ? 50 : 30 + r * 40 };
  });
  const s = 12;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      {pts.slice(1).map((p, i) => {
        const a = pts[i];
        return <path key={i} d={curve(a.x + s / 2, a.y, p.x - s / 2, p.y)} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />;
      })}
      {pts.map((p, i) =>
        i === 0 ? (
          <path key={i} d={`M${p.x} ${p.y - s / 2} H${p.x + s / 2 - 3} Q${p.x + s / 2} ${p.y - s / 2} ${p.x + s / 2} ${p.y - s / 2 + 3} V${p.y + s / 2 - 3} Q${p.x + s / 2} ${p.y + s / 2} ${p.x + s / 2 - 3} ${p.y + s / 2} H${p.x} A${s / 2} ${s / 2} 0 0 1 ${p.x} ${p.y - s / 2} Z`} fill="#0a0a0a" stroke="#fff" strokeWidth="1.2" />
        ) : (
          <rect key={i} x={p.x - s / 2} y={p.y - s / 2} width={s} height={s} rx="3" fill="#0a0a0a" stroke="#fff" strokeWidth="1.2" />
        ),
      )}
    </svg>
  );
}
