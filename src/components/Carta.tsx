import { lazy, Suspense, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { brand, carta, cartaCopy, type Drink as DrinkT } from '../content';
import { useReveal } from '../lib/reveal';
import { sendOrder } from '../lib/order';
import { scroller } from '../lib/scroller';

const Drink = lazy(() => import('../gl/Drink'));

/**
 * A carta é o mesmo shader do hero, com o drink escolhido. Trocar de drink
 * transforma a taça (balão ↔ coupe), muda a cor e troca a guarnição.
 *
 * No celular a taça fica em cima e a lista embaixo: quem desce para escolher
 * perde a taça de vista. Então ela vira um mini player fixo no canto (o mesmo
 * canvas, sem abrir outro contexto WebGL) e um toque nele volta para a vista grande.
 */
export default function Carta() {
  const root = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const [group, setGroup] = useState(carta[0].id);
  const [pick, setPick] = useState<DrinkT>(carta[0].drinks[0]);
  const [pip, setPip] = useState(false);
  useReveal(root);

  useGSAP(
    () => {
      if (!window.matchMedia('(max-width: 899px)').matches) return;
      // liga quando a taça já subiu quase toda; desliga no fim da lista
      const st = ScrollTrigger.create({
        trigger: slot.current,
        start: 'bottom 38%',
        endTrigger: root.current,
        end: 'bottom 90%',
        onToggle: (s) => setPip(s.isActive),
      });
      return () => st.kill();
    },
    { scope: root },
  );

  const g = carta.find((x) => x.id === group)!;

  const choose = (d: DrinkT) => setPick(d);
  const openGroup = (id: string) => {
    setGroup(id);
    setPick(carta.find((x) => x.id === id)!.drinks[0]);
  };

  const back = () => {
    const el = slot.current;
    if (!el) return;
    const offset = -Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 64) - 12;
    if (scroller.lenis) scroller.lenis.scrollTo(el, { duration: 1.1, offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
  };

  return (
    <section className="carta" id="carta" ref={root} data-tone="dark">
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">II</span> {cartaCopy.label}
        </p>
        <p className="eyebrow">{cartaCopy.demo}</p>
      </div>

      <div className="carta__grid">
        <div className="carta__copy">
          <h2 className="display carta__title" data-split>
            {cartaCopy.title[0]} <em>{cartaCopy.title[1]}</em>
          </h2>
          <p className="carta__body" data-rise>
            {cartaCopy.body}
          </p>

          <div className="tabs" role="tablist" aria-label="Seções da carta" data-rise>
            {carta.map((x) => (
              <button key={x.id} role="tab" aria-selected={group === x.id} className={`tabs__tab ${group === x.id ? 'is-on' : ''}`} onClick={() => openGroup(x.id)}>
                {x.title}
                <small>{x.drinks.length}</small>
              </button>
            ))}
          </div>
          <p className="carta__sub" data-rise>
            <em>{g.subtitle}</em>
          </p>

          <ul className="drinks" role="tabpanel" aria-label={g.title}>
            {g.drinks.map((d, i) => (
              <li key={d.slug}>
                <button className={`drink ${pick.slug === d.slug ? 'is-on' : ''}`} onClick={() => choose(d)} aria-pressed={pick.slug === d.slug} data-cursor="servir">
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  <span className="drink__name">{d.name}</span>
                  <span className="drink__base">{d.base}</span>
                  <span className="drink__dot" style={{ background: d.look.color }} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* o slot guarda o lugar da taça na página enquanto ela está no canto */}
        <div className="carta__slot" ref={slot}>
          <figure className={`carta__stage ${pip ? 'is-pip' : ''}`}>
            <Suspense fallback={<div className="carta__gl" />}>
              <Drink mode={{ kind: 'card', look: pick.look }} className="carta__gl" />
            </Suspense>
            <figcaption className="carta__cap" key={pick.slug}>
              {pick.signature && <p className="eyebrow eyebrow--gold">Assinatura da casa</p>}
              <h3 className="carta__name">{pick.name}</h3>
              <p className="carta__notes">{pick.notes}</p>
              <button className="link" onClick={() => sendOrder(`Olá, ${brand.name}! Quero o ${pick.name} na carta do meu evento.`)} data-cursor="pedir">
                Quero na minha festa <i aria-hidden="true">→</i>
              </button>
            </figcaption>
            <p className="carta__hint">Simulação 3D</p>
            {pip && (
              <button className="carta__pip" onClick={back} aria-label={`${pick.name}: ver o drink maior`}>
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </figure>
        </div>
      </div>
    </section>
  );
}
