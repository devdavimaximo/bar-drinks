import { useEffect } from 'react';
import { markReady } from '../lib/scroller';

/**
 * Sem cena de abertura: o hero começa assim que o React monta. O drink 3D
 * aparece por cima da foto do primeiro quadro quando o shader termina de compilar.
 */
export default function Preloader() {
  useEffect(() => {
    document.getElementById('preloader')?.remove();
    markReady();
  }, []);
  return null;
}
