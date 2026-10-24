const CENTERS = [10.5, 26.5, 43];

const spindle = (c: number) =>
  `M${c} 0C${c + 1.5} 3 ${c + 1.5} 6 ${c + 3} 10.5C${c + 1.5} 15 ${c + 1.5} 18 ${c} 21C${c - 1.5} 18 ${c - 1.5} 15 ${c - 3} 10.5C${c - 1.5} 6 ${c - 1.5} 3 ${c} 0Z`;

export default function N8nLogo() {
  return (
    <svg viewBox="0 0 53 21" role="img" aria-label="n8n" className="logo-float mx-auto mb-8 lg:mx-0 h-12 w-auto sm:h-16 lg:h-9" fill="white">
      <rect x="0" y="9" width="53" height="3" rx="1.5" />
      {CENTERS.map((c) => (
        <path key={c} d={spindle(c)} />
      ))}
    </svg>
  );
}
