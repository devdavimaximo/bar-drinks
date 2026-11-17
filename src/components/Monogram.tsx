/** marca Renan Open Drink: taça de martini e coqueteleira dentro de um círculo, em traço; pega a cor do texto */
export default function Monogram({ className = '', ring = true }: { className?: string; ring?: boolean }) {
  return (
    <svg className={`mono ${className}`} viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ring && <circle className="mono__ring" cx="32" cy="32" r="30" />}
      <path className="mono__glass" d="M14 23h18L23 33v12 M18.5 45h9" />
      <path className="mono__drink" d="M17 26h12" opacity="0.6" />
      <path d="M37 16h8 M36 19h10l-1 4h-8z M37 23c-1.5 3-2 6-2 9v14c0 1.2 1 2 2 2h8c1 0 2-.8 2-2V32c0-3-.5-6-2-9" />
    </svg>
  );
}
