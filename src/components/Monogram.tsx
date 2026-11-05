/** marca demonstrativa: uma coupe dentro de um círculo, em traço; pega a cor do texto */
export default function Monogram({ className = '', ring = true }: { className?: string; ring?: boolean }) {
  return (
    <svg className={`mono ${className}`} viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ring && <circle className="mono__ring" cx="32" cy="32" r="30" />}
      <path className="mono__glass" d="M18 21h28c0 7-6.3 12.5-14 12.5S18 28 18 21z M32 33.5V46 M24.5 46h15" />
      <path className="mono__drink" d="M21.5 24h21" opacity="0.6" />
    </svg>
  );
}
