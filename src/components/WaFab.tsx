import { useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contato } from '../content';
import { sendOrder } from '../lib/order';

/**
 * Celular: o "Pedir orçamento" do cabeçalho some (falta espaço), e o hero ocupa
 * algumas telas de animação. Este botão aparece quando o hero acaba e some no
 * contato, que já tem os próprios botões. No desktop o CSS esconde.
 */
export default function WaFab() {
  const [after, setAfter] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const a = ScrollTrigger.create({ trigger: '#galeria', start: 'top 70%', end: 'max', onToggle: (s) => setAfter(s.isActive) });
    const b = ScrollTrigger.create({ trigger: '#contato', start: 'top 80%', end: 'max', onToggle: (s) => setAtEnd(s.isActive) });
    return () => {
      a.kill();
      b.kill();
    };
  }, []);

  const shown = after && !atEnd;
  return (
    <button className={`wa-fab ${shown ? 'is-on' : ''}`} onClick={() => sendOrder(contato.message)} tabIndex={shown ? 0 : -1} aria-hidden={!shown}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z" />
      </svg>
      Pedir orçamento
    </button>
  );
}
