import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { LITE } from './env';

/**
 * Prepara as animações de uma seção só quando ela chega perto da tela (uma tela
 * de antecedência). Montar tudo de uma vez no carregamento (SplitText mede cada
 * linha, cada ScrollTrigger mede a página) travava o celular por ~1 s logo depois
 * da abertura. `setup` roda dentro de um gsap.context: desmontar desfaz tudo.
 */
export function useNear(scope: RefObject<HTMLElement | null>, setup: (el: HTMLElement) => void, margin = '100% 0px') {
  const fn = useRef(setup);
  fn.current = setup;
  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    let ctx: gsap.Context | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        ctx = gsap.context(() => fn.current(el), el);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      ctx?.revert();
    };
  }, [scope, margin]);
}

/**
 * [data-split] → linhas sobem por trás de uma máscara
 * [data-rise]  → bloco sobe e aparece (valor = atraso)
 * [data-words] → palavras acendem no ritmo da leitura
 * [data-veil]  → imagem se revela de baixo para cima, com leve zoom de saída
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useNear(
    scope,
    () => {
      const q = gsap.utils.selector(scope);

      q('[data-split]').forEach((el: HTMLElement) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'ln',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 140,
              duration: 1.35,
              ease: 'expo.out',
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        });
      });

      q('[data-rise]').forEach((el: HTMLElement) => {
        gsap.from(el, {
          y: 36,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'expo.out',
          delay: Number(el.dataset.rise || 0),
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });

      q('[data-words]').forEach((el: HTMLElement) => {
        const split = SplitText.create(el, { type: 'words', wordsClass: 'wd' });
        gsap.fromTo(
          split.words,
          LITE ? { opacity: 0.16 } : { opacity: 0.16, filter: 'blur(5px)' },
          {
            opacity: 1,
            ...(LITE ? {} : { filter: 'blur(0px)' }),
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: true },
          },
        );
      });

      q('[data-veil]').forEach((el: HTMLElement) => {
        const img = el.querySelector('img');
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.6,
            ease: 'expo.inOut',
            delay: Number(el.dataset.veil || 0),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        );
        if (img)
          gsap.fromTo(
            img,
            { scale: 1.25 },
            { scale: 1, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
          );
      });
    },
  );
}
