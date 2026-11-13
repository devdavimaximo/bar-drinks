/* ==========================================================================
   Prévia personalizada: o mesmo site, com o nome do bar que está sendo prospectado.

   Duas portas de entrada, a segunda vence a primeira:
     1. página gerada no build (prospects.json → dist/<slug>.html), que define
        window.__PROSPECT antes do app. É essa que tem a imagem de prévia no WhatsApp.
     2. parâmetros na URL, para testar na hora: ?bar=Drinks+da+Ana&ig=drinksdaana
        &wa=5541999999999&cidade=Curitiba

   Tudo passa por limpeza aqui: o texto vai para a tela via React (nunca como HTML),
   mas mesmo assim cortamos o tamanho e os caracteres de cada campo.
   ========================================================================== */

export type Prospect = {
  /** nome do bar, como aparece no site */
  bar: string;
  /** Instagram sem @ */
  ig: string;
  /** WhatsApp só com dígitos: DDI + DDD + número */
  wa: string;
  /** cidade ou região atendida */
  cidade: string;
};

const LIMITS = { bar: 32, ig: 30, wa: 15, cidade: 40 } as const;

export function cleanProspect(raw: Partial<Record<keyof Prospect, unknown>>): Prospect {
  const text = (v: unknown, max: number) =>
    String(v ?? '')
      .replace(/[\u0000-\u001f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  return {
    bar: text(raw.bar, LIMITS.bar),
    ig: text(raw.ig, LIMITS.ig)
      .replace(/^@/, '')
      .replace(/[^\w.]/g, ''),
    wa: String(raw.wa ?? '')
      .replace(/\D/g, '')
      .slice(0, LIMITS.wa),
    cidade: text(raw.cidade, LIMITS.cidade),
  };
}

declare global {
  interface Window {
    __PROSPECT?: Partial<Prospect>;
  }
}

function read(): Prospect {
  if (typeof window === 'undefined') return cleanProspect({});
  const q = new URLSearchParams(window.location.search);
  const fromUrl = Object.fromEntries(['bar', 'ig', 'wa', 'cidade'].filter((k) => q.get(k)).map((k) => [k, q.get(k)]));
  return cleanProspect({ ...(window.__PROSPECT ?? {}), ...fromUrl });
}

export const prospect = read();
/** há um nome de bar: o site vira "a prévia do site de fulano" */
export const personalized = prospect.bar.length > 0;
