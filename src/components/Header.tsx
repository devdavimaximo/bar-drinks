import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { brand, contato, nav } from '../content';
import { onReady, scroller, scrollToId } from '../lib/scroller';
import { sendOrder } from '../lib/order';
import Monogram from './Monogram';

/**
 * Cabeçalho fixo. Seções escuras marcam [data-tone="dark"]; o cabeçalho troca
 * de tinta quando passa por cima delas. Some ao descer, volta ao subir.
 */
export default function Header() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  // as classes vivem no estado: um className reescrito pelo React não apaga o que o scroll ligou
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useGSAP(() => {
    gsap.set(root.current, { autoAlpha: 0, y: -16 });
    const off = onReady(() => gsap.to(root.current, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: 0.9 }));

    const darks = gsap.utils.toArray<HTMLElement>('[data-tone="dark"]');
    darks.forEach((el) =>
      // o hero fica fixado por várias telas e o pino ainda não existe aqui: quem diz
      // que ele acabou é a seção seguinte chegando ao topo
      el.id === 'topo'
        ? ScrollTrigger.create({
            trigger: '#o-bar',
            start: 'top 40px',
            refreshPriority: -10,
            onEnter: () => setDark(false),
            onLeaveBack: () => setDark(true),
          })
        : ScrollTrigger.create({
        trigger: el,
        start: 'top 40px',
        end: 'bottom 40px',
        refreshPriority: -10,
        onToggle: (s) => s.isActive && setDark(true),
        onLeave: () => setDark(false),
        onLeaveBack: () => setDark(false),
      }),
    );

    nav.forEach(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 50%',
        end: 'bottom 50%',
        refreshPriority: -10,
        onToggle: (s) => s.isActive && setActive(id),
        onLeaveBack: () => id === nav[0].id && setActive(''),
      }),
    );

    // véu atrás do cabeçalho só depois do hero (no hero, o bar é a própria cena)
    ScrollTrigger.create({
      trigger: '#o-bar',
      start: 'top 80px',
      end: 'max',
      refreshPriority: -10,
      onToggle: (s) => setScrolled(s.isActive),
    });

    let last = 0;
    const hide = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => {
        const y = s.scroll();
        const down = y > last && y > 400;
        setHidden(down && Math.abs(scroller.velocity) > 0.4);
        last = y;
      },
    });

    return () => {
      off();
      hide.kill();
    };
  });

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
    if (open) scroller.lenis?.stop();
    else scroller.lenis?.start();
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <header className={`hud ${dark ? 'is-dark' : ''} ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''} ${open ? 'is-open' : ''}`} ref={root}>
        <button className="hud__brand" onClick={() => go('topo')} aria-label={`${brand.name}, voltar ao início`} data-cursor="início">
          <Monogram className="hud__mono" />
          <span className="hud__word">{brand.name}</span>
        </button>

        <nav className="hud__nav" aria-label="Seções">
          {nav.map((n) => (
            <button key={n.id} className={`hud__link ${active === n.id ? 'is-active' : ''}`} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>

        <button className="hud__cta" onClick={() => sendOrder(contato.message)} data-cursor="conversar">
          Pedir orçamento
        </button>

        <button className="hud__burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu-movel" aria-label={open ? 'Fechar menu' : 'Abrir menu'}>
          <i />
          <i />
        </button>
      </header>

      {/* fora do <header>: o transform dele prenderia o position: fixed à altura da barra */}
      <div className={`drawer ${open ? 'is-open' : ''}`} id="menu-movel" aria-hidden={!open}>
        <ol className="drawer__list">
          {nav.map((n, i) => (
            <li key={n.id} style={{ transitionDelay: open ? `${0.08 + i * 0.05}s` : '0s' }}>
              <button onClick={() => go(n.id)} tabIndex={open ? 0 : -1}>
                <small>{String(i + 1).padStart(2, '0')}</small>
                {n.label}
              </button>
            </li>
          ))}
        </ol>
        <div className="drawer__foot">
          <a href={brand.instagramUrl} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            {brand.instagram}
          </a>
          <span>{brand.region}</span>
        </div>
      </div>
    </>
  );
}
