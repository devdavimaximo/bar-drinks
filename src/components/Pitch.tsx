import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { pitch } from '../content';

/**
 * Modo apresentação (?pitch=1): uma nota de venda no topo de cada seção, para
 * mostrar o site numa reunião com o dono do bar. As notas entram dentro das
 * próprias seções (portal), então rolam e fixam junto com elas, inclusive no hero.
 */
export default function Pitch() {
  const [hosts, setHosts] = useState<[string, HTMLElement][]>([]);
  const [off, setOff] = useState(false);

  useEffect(() => {
    const found: [string, HTMLElement][] = [];
    for (const id of Object.keys(pitch)) {
      const el = document.getElementById(id);
      if (!el) continue;
      // o hero é fixado pelo GSAP (posição inline): não mexe nele
      if (getComputedStyle(el).position === 'static') el.classList.add('pitch-host');
      found.push([id, el]);
    }
    setHosts(found);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('pitch-off', off);
  }, [off]);

  return (
    <>
      {hosts.map(([id, el]) =>
        createPortal(
          <aside className="pitch-note" aria-label="Nota de apresentação">
            <b>Por que isso vende</b>
            <strong>{pitch[id][0]}</strong>
            <p>{pitch[id][1]}</p>
          </aside>,
          el,
          id,
        ),
      )}
      <div className="pitch-bar">
        Modo apresentação
        <button onClick={() => setOff((v) => !v)}>{off ? 'mostrar notas' : 'ocultar notas'}</button>
      </div>
    </>
  );
}
