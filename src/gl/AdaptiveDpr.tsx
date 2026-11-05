import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Resolução adaptativa: mede o tempo médio de quadro a cada segundo.
 * Abaixo de ~45fps, reduz a resolução interna do canvas em degraus de 0.125;
 * depois de 3 segundos folgados (~58fps+), devolve um degrau. Raymarching cobra
 * por pixel: em telas grandes é isso que mantém o corte fluido.
 * Com desenho sob demanda, `chained` informa se o quadro veio logo depois do
 * anterior; quadros após uma pausa (ou de propósito a 30 fps) não entram na média.
 */
export default function AdaptiveDpr({ min = 0.6, max, chained }: { min?: number; max: number; chained?: () => boolean }) {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, dpr: max, good: 0 });

  useFrame((_, delta) => {
    if (chained && !chained()) return;
    const a = acc.current;
    a.t += Math.min(delta, 0.1);
    a.n++;
    if (a.t < 1) return;
    const avg = a.t / a.n;
    a.t = 0;
    a.n = 0;
    if (avg > 1 / 45 && a.dpr > min) {
      a.dpr = Math.max(min, a.dpr - 0.125);
      a.good = 0;
      setDpr(a.dpr);
    } else if (avg < 1 / 58 && a.dpr < max && ++a.good >= 3) {
      a.dpr = Math.min(max, a.dpr + 0.125);
      a.good = 0;
      setDpr(a.dpr);
    }
  });

  return null;
}
