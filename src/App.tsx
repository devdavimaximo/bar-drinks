import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { REDUCED } from './lib/env';
import { onReady, scroller, signals } from './lib/scroller';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Cursor from './components/Cursor';
import Toast from './components/Toast';
import Hero from './components/Hero';
import Manifesto from './components/Manifesto';
import Carta from './components/Carta';
import Eventos from './components/Eventos';
import Monte from './components/Monte';
import Galeria from './components/Galeria';
import Faq from './components/Faq';
import Contato from './components/Contato';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
// no celular a barra de endereço some e volta ao rolar: isso não deve recalcular os pinos
ScrollTrigger.config({ ignoreMobileResize: true });

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('is-loading');
    const lenis = REDUCED ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    scroller.lenis = lenis;

    const tick = (t: number) => lenis?.raf(t * 1000);
    if (lenis) {
      lenis.stop();
      lenis.on('scroll', (l: Lenis) => {
        scroller.velocity = l.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const off = onReady(() => {
      document.documentElement.classList.remove('is-loading');
      lenis?.start();
      ScrollTrigger.refresh();
    });

    const move = (e: PointerEvent) => {
      signals.mx = (e.clientX / window.innerWidth) * 2 - 1;
      signals.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });

    // fontes mudam métricas depois de carregar: recalcula os gatilhos
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      off();
      window.removeEventListener('pointermove', move);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      scroller.lenis = null;
    };
  }, []);

  return (
    <>
      <Preloader />
      <Cursor />
      <Header />
      <Toast />
      <div className="grain" aria-hidden="true" />
      {/* modelo de apresentação: não é o site oficial da casa */}
      <p className="demo-tag">Demonstração · proposta de site</p>
      <main>
        <Hero />
        <Manifesto />
        <Carta />
        <Eventos />
        <Monte />
        <Galeria />
        <Faq />
      </main>
      <Contato />
    </>
  );
}
