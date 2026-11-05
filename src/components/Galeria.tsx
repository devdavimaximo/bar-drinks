import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { galeria } from '../content';
import { LITE, REDUCED } from '../lib/env';
import { useReveal } from '../lib/reveal';
import Img from './Img';
import Monogram from './Monogram';

/**
 * Fotos dos eventos e o que os anfitriões disseram. Enquanto o cliente não manda
 * as fotos, cada moldura mostra onde a foto entra (luz de bar, legenda e o aviso).
 */
export default function Galeria() {
  const root = useRef<HTMLElement>(null);
  const [q, setQ] = useState(0);
  useReveal(root);

  // as molduras andam em velocidades diferentes: profundidade sem 3D
  useGSAP(
    () => {
      if (LITE) return;
      gsap.utils.toArray<HTMLElement>('.shot', root.current).forEach((el, i) =>
        gsap.to(el, {
          yPercent: [-6, -16, -2, -12, -8, -18][i % 6],
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        }),
      );
    },
    { scope: root },
  );

  // os depoimentos se revezam sozinhos
  useEffect(() => {
    if (REDUCED) return;
    const t = window.setInterval(() => setQ((i) => (i + 1) % galeria.quotes.length), 7000);
    return () => window.clearInterval(t);
  }, [q]);

  const quote = galeria.quotes[q];

  return (
    <section className="galeria" id="galeria" ref={root} data-tone="dark">
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">V</span> {galeria.label}
        </p>
        <p className="eyebrow">Momentos</p>
      </div>

      <h2 className="display galeria__title" data-split>
        {galeria.title[0]} <em>{galeria.title[1]}</em>
      </h2>

      <div className="shots">
        {galeria.photos.map((p, i) => (
          <figure key={p.caption} className={`shot shot--${i + 1} tone--${p.tone}`} data-veil={(i % 3) * 0.1}>
            {p.src ? (
              <Img src={p.src} alt={`${p.caption}, ${p.meta}`} sizes="(max-width: 899px) 90vw, 33vw" />
            ) : (
              <div className="shot__ph" aria-hidden="true">
                <Monogram className="shot__mono" />
                <span>foto do evento</span>
              </div>
            )}
            <figcaption>
              <small>{String(i + 1).padStart(2, '0')}</small>
              {p.caption}
              <em>{p.meta}</em>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="shots__note">{galeria.note}</p>

      <div className="quotes" data-rise>
        <p className="quotes__mark" aria-hidden="true">
          “
        </p>
        <blockquote className="quotes__q" key={q}>
          <p>{quote.text}</p>
          <footer>
            {quote.who} <span>· {quote.where}</span>
          </footer>
        </blockquote>
        <div className="quotes__nav" role="tablist" aria-label="Depoimentos">
          {galeria.quotes.map((x, i) => (
            <button key={x.where} role="tab" aria-selected={i === q} aria-label={`Depoimento ${i + 1}`} className={i === q ? 'is-on' : ''} onClick={() => setQ(i)} />
          ))}
        </div>
        <p className="quotes__note">Depoimentos ilustrativos · substituir pelos do cliente</p>
      </div>
    </section>
  );
}
