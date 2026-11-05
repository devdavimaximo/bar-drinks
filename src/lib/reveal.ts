import type { RefObject } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { LITE } from './env';

/**
 * [data-split] → linhas sobem por trás de uma máscara
 * [data-rise]  → bloco sobe e aparece (valor = atraso)
 * [data-words] → palavras acendem no ritmo da leitura
 * [data-veil]  → imagem se revela de baixo para cima, com leve zoom de saída
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
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
    { scope },
  );
}
