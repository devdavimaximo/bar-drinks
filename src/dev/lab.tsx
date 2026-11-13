import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Drink, { type Snapshot } from '../gl/Drink';
import { carta } from '../content';
import { markReady, signals } from '../lib/scroller';

/**
 * Laboratório: a montagem do hero num slider (?p=0.5) e cada drink da carta (?d=clover).
 * ?poster=desktop|mobile espera a luz do bar subir, fotografa o quadro em alta e
 * salva em public/media/poster-<nome>.webp (só no npm run dev; ver vite.config.ts).
 */
function Lab() {
  const params = new URLSearchParams(location.search);
  const slug = params.get('d');
  const poster = params.get('poster');
  const [p, setP] = useState(Number(params.get('p') ?? 0));
  const [msg, setMsg] = useState('');
  const snap = useRef<Snapshot | null>(null);
  useEffect(() => markReady(), []);
  useEffect(() => void (signals.build = p), [p]);
  const look = carta.flatMap((g) => g.drinks).find((d) => d.slug === slug)?.look;

  useEffect(() => {
    if (!poster) return;
    // espera o shader compilar (a compilação fria pode passar de 5 s) e a luz subir (~2 s)
    let t = 0;
    let readyAt = 0;
    const tryShot = async () => {
      const ready = window.__glReady;
      if (ready && !readyAt) readyAt = performance.now();
      if (!ready || performance.now() - readyAt < 2600) return void (t = window.setTimeout(tryShot, 300));
      const url = snap.current?.(poster === 'mobile' ? 860 : 1920);
      if (!url) return setMsg('drink ainda não desenhou');
      const r = await fetch(`/__poster?name=${poster}`, { method: 'POST', body: url });
      setMsg(r.ok ? `poster-${poster}.webp salvo` : 'falhou');
    };
    tryShot();
    return () => clearTimeout(t);
  }, [poster]);

  return (
    <div className="lab">
      <Drink mode={look ? { kind: 'card', look } : { kind: 'hero' }} snap={snap} />
      {!look && !poster && (
        <div className="lab__ui">
          <span>{p.toFixed(3)}</span>
          <input type="range" min={0} max={1} step={0.001} value={p} onChange={(e) => setP(Number(e.target.value))} />
        </div>
      )}
      {msg && <p className="lab__ui" id="lab-msg">{msg}</p>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Lab />);
