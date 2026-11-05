import { useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { brand, monte } from '../content';
import { brl, clamp, damp, REDUCED } from '../lib/env';
import { useReveal } from '../lib/reveal';
import { sendOrder } from '../lib/order';

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** regras de bolso do balcão: quanto o bar serve e quanto gelo leva */
export function estimate(guests: number, hours: number, pkgId: string, extras: string[]) {
  const pkg = monte.packages.find((p) => p.id === pkgId)!;
  const factor = 1 + (hours - monte.baseHours) * monte.hourStep;
  const extrasTotal = monte.extras.filter((e) => extras.includes(e.id)).reduce((a, e) => a + (e.per ? e.price * guests : e.price), 0);
  const total = Math.round((guests * pkg.perGuest * factor + extrasTotal) / 50) * 50;
  // ~15% não bebe drinks; quem bebe toma 1,5 na primeira hora e quase um por hora depois
  const drinks = Math.round(guests * 0.85 * (1.5 + 0.9 * (hours - 1)));
  const bartenders = Math.ceil(guests / monte.perBartender) + (pkgId === 'premium' ? 1 : 0);
  const ice = Math.round(guests * 1.2 * (hours / 5));
  return { pkg, total, drinks, bartenders, ice, perGuest: Math.round(total / guests) };
}

const TONES = ['#f27e9d', '#e8476a', '#d9efb4', '#f4d35a', '#a565c2', '#eef2cf', '#f7b8c6'];

/** as taças vistas de cima: cada uma são dez drinks servidos */
function GlassField({ drinks }: { drinks: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const target = useRef(drinks);
  target.current = drinks;

  useEffect(() => {
    const c = cv.current!;
    const ctx = c.getContext('2d')!;
    const MAXD = 520;
    const scale = new Float32Array(MAXD);
    const tones = Array.from({ length: MAXD }, (_, i) => TONES[Math.floor(Math.abs(Math.sin(i * 91.7) * 1e4) % TONES.length)]);
    let raf = 0;
    let visible = false;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const w = c.clientWidth;
      const h = c.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cols = w < 420 ? 18 : 26;
      const cell = w / cols;
      const n = Math.round(target.current / 10);
      for (let i = 0; i < MAXD; i++) {
        const want = i < n ? 1 : 0;
        scale[i] = REDUCED ? want : damp(scale[i], want, 9 - Math.min(6, Math.abs(i - n) * 0.06), dt);
        const s = scale[i];
        const x = (i % cols) * cell + cell / 2;
        const y = Math.floor(i / cols) * cell + cell / 2;
        if (y > h + cell) break;
        // a borda da taça
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.42, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239,231,218,0.13)';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (s < 0.02) continue;
        // a bebida, com um brilho de luz e um cubo de gelo
        const r = cell * 0.34 * clamp(s, 0, 1.15);
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.7)');
        g.addColorStop(0.3, tones[i]);
        g.addColorStop(1, tones[i]);
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.globalAlpha = 0.45 * s;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x - r * 0.25, y - r * 0.05, r * 0.42, r * 0.42);
        ctx.globalAlpha = 1;
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    });
    io.observe(c);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas className="glasses" ref={cv} aria-hidden="true" />;
}

/** número que rola até o novo valor em vez de saltar */
function Roll({ value, format = fmt }: { value: number; format?: (n: number) => string }) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: value });
  useEffect(() => {
    const t = gsap.to(shown.current, {
      v: value,
      duration: REDUCED ? 0 : 0.7,
      ease: 'power3.out',
      onUpdate: () => {
        if (el.current) el.current.textContent = format(Math.round(shown.current.v));
      },
    });
    return () => void t.kill();
  }, [value, format]);
  return <span ref={el}>{format(value)}</span>;
}

export default function Monte() {
  const root = useRef<HTMLElement>(null);
  const [kind, setKind] = useState(monte.kinds[0]);
  const [guests, setGuests] = useState(monte.guests.initial);
  const [hours, setHours] = useState(monte.baseHours);
  const [pkg, setPkg] = useState(monte.packages.find((p) => p.featured)!.id);
  const [extras, setExtras] = useState<string[]>([]);
  const [date, setDate] = useState('');
  useReveal(root);

  const r = estimate(guests, hours, pkg, extras);
  const pct = ((guests - monte.guests.min) / (monte.guests.max - monte.guests.min)) * 100;
  const flip = (id: string) => setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  const when = date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR') : 'a definir';
  const message = [
    `Olá, ${brand.name}! Montei o bar no site:`,
    `• ${kind}, ${guests} convidados, ${hours} horas`,
    `• Pacote ${r.pkg.name} (${r.pkg.drinks} drinks na carta)`,
    ...monte.extras.filter((e) => extras.includes(e.id)).map((e) => `• ${e.name}`),
    `• Estimativa do site: ${brl(r.total)}`,
    `Data: ${when}`,
    'Local do evento: ',
  ].join('\n');

  return (
    <section className="monte" id="monte" ref={root}>
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">IV</span> {monte.label}
        </p>
        <p className="eyebrow">Calculadora</p>
      </div>

      <div className="monte__grid">
        <div className="monte__copy">
          <h2 className="display monte__title" data-split>
            {monte.title[0]}
            <br />
            <em>{monte.title[1]}</em>
          </h2>
          <p className="monte__body" data-rise>
            {monte.body}
          </p>

          <div className="ctrl" data-rise>
            <p className="ctrl__label">O evento</p>
            <div className="seg" role="radiogroup" aria-label="Tipo de evento">
              {monte.kinds.map((k) => (
                <button key={k} role="radio" aria-checked={kind === k} className={`seg__opt ${kind === k ? 'is-on' : ''}`} onClick={() => setKind(k)}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl" data-rise>
            <label className="ctrl__label" htmlFor="guests">
              Convidados <output>{guests}</output>
            </label>
            <input
              id="guests"
              className="range"
              type="range"
              min={monte.guests.min}
              max={monte.guests.max}
              step={monte.guests.step}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              style={{ '--p': `${pct}%` } as CSSProperties}
              data-cursor="arrastar"
            />
            <div className="ctrl__scale" aria-hidden="true">
              <span>{monte.guests.min}</span>
              <span>{monte.guests.max}</span>
            </div>
          </div>

          <div className="ctrl" data-rise>
            <p className="ctrl__label">Horas de bar aberto</p>
            <div className="seg" role="radiogroup" aria-label="Horas de bar aberto">
              {monte.hours.map((h) => (
                <button key={h} role="radio" aria-checked={hours === h} className={`seg__opt ${hours === h ? 'is-on' : ''}`} onClick={() => setHours(h)}>
                  {h} h
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl" data-rise>
            <p className="ctrl__label">Pacote</p>
            <div className="pkgs" role="radiogroup" aria-label="Pacote">
              {monte.packages.map((p) => (
                <button key={p.id} role="radio" aria-checked={pkg === p.id} className={`pkg ${pkg === p.id ? 'is-on' : ''}`} onClick={() => setPkg(p.id)}>
                  <span className="pkg__name">
                    {p.name}
                    {p.featured && <small>mais pedido</small>}
                  </span>
                  <span className="pkg__price">{brl(p.perGuest)}/convidado</span>
                  <span className="pkg__text">{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl" data-rise>
            <p className="ctrl__label">Extras</p>
            <ul className="extras">
              {monte.extras.map((e) => (
                <li key={e.id}>
                  <label className="check">
                    <input type="checkbox" checked={extras.includes(e.id)} onChange={() => flip(e.id)} />
                    <span aria-hidden="true" />
                    {e.name}
                    <small>{e.per ? `+ ${brl(e.price)}/convidado` : `+ ${brl(e.price)}`}</small>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="ctrl" data-rise>
            <label className="ctrl__label" htmlFor="data">
              Data do evento
            </label>
            <input id="data" className="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {/* painel escuro dentro de seção clara: tom pela classe, não por data-tone (o cabeçalho não deve virar) */}
        <div className="monte__out tone-dark">
          <p className="eyebrow">Estimativa</p>
          <p className="monte__total">
            <Roll value={r.total} format={brl} />
          </p>
          <p className="monte__per">
            ≈ {brl(r.perGuest)} por convidado · pacote {r.pkg.name}
          </p>

          <GlassField drinks={r.drinks} />
          <p className="monte__legend">cada taça, dez drinks servidos</p>

          <dl className="stats">
            <div>
              <dt>Drinks servidos</dt>
              <dd>
                ≈ <Roll value={r.drinks} />
              </dd>
            </div>
            <div>
              <dt>Bartenders</dt>
              <dd>
                <Roll value={r.bartenders} />
              </dd>
            </div>
            <div>
              <dt>Gelo</dt>
              <dd>
                <Roll value={r.ice} /> kg
              </dd>
            </div>
            <div>
              <dt>Bar aberto</dt>
              <dd>{hours} h</dd>
            </div>
          </dl>

          <button className="btn btn--rose btn--lg" onClick={() => sendOrder(message)} data-cursor="enviar">
            Enviar para o WhatsApp
          </button>
          <p className="monte__caveat">{monte.caveat}</p>
        </div>
      </div>
    </section>
  );
}
