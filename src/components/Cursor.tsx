import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FINE_POINTER, REDUCED } from '../lib/env';

/** ponto de ouro + anel que cresce e escreve o que o clique faz ([data-cursor]) */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!FINE_POINTER || REDUCED) return;
    document.documentElement.classList.add('has-cursor');
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' });

    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button, [role="slider"], input');
      const text = t?.dataset.cursor ?? '';
      ring.current?.classList.toggle('is-hover', !!t);
      ring.current?.classList.toggle('has-label', !!text);
      if (label.current) label.current.textContent = text;
    };
    const leave = () => ring.current?.classList.add('is-out');
    const enter = () => ring.current?.classList.remove('is-out');

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
    };
  }, []);

  if (!FINE_POINTER) return null;
  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span ref={label} />
      </div>
    </>
  );
}
