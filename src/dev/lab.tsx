import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Drink from '../gl/Drink';
import { carta } from '../content';
import { markReady, signals } from '../lib/scroller';

/** laboratório: a montagem do hero num slider (?p=0.5) e cada drink da carta (?d=clover) */
function Lab() {
  const params = new URLSearchParams(location.search);
  const slug = params.get('d');
  const [p, setP] = useState(Number(params.get('p') ?? 0));
  useEffect(() => markReady(), []);
  useEffect(() => void (signals.build = p), [p]);
  const look = carta.flatMap((g) => g.drinks).find((d) => d.slug === slug)?.look;

  return (
    <div className="lab">
      <Drink mode={look ? { kind: 'card', look } : { kind: 'hero' }} />
      {!look && (
        <div className="lab__ui">
          <span>{p.toFixed(3)}</span>
          <input type="range" min={0} max={1} step={0.001} value={p} onChange={(e) => setP(Number(e.target.value))} />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Lab />);
