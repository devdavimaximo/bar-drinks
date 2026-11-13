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
  /** cor da marca (#rrggbb): vira o tom dos destaques no lugar do rosa */
  cor: string;
  /** fotos do prospect geradas no build (media/p/<slug>/<n>-900.webp...), no formato do `src` da galeria */
  fotos: string[];
  /** logo gerada no build (media/p/<slug>/logo.png|svg) */
  logo: string;
};

const LIMITS = { bar: 32, ig: 30, wa: 15, cidade: 40 } as const;

export function cleanProspect(raw: Partial<Record<keyof Prospect, unknown>>): Prospect {
  const cor = String(raw.cor ?? '').trim().replace(/^#?/, '#');
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
    cor: /^#[0-9a-f]{6}$/i.test(cor) ? cor.toLowerCase() : '',
    // só caminhos no formato que o próprio build gera
    fotos: (Array.isArray(raw.fotos) ? raw.fotos : [])
      .map(String)
      .filter((f) => /^p\/[a-z0-9-]+\/\d{1,2}$/.test(f))
      .slice(0, 6),
    logo: /^media\/p\/[a-z0-9-]+\/logo\.(png|svg)$/.test(String(raw.logo ?? '')) ? String(raw.logo) : '',
  };
}

/* ---------- a cor da marca, legível nos dois fundos ----------
   O site usa três tons do destaque: --rose (base), --rose-2 (texto e botão no fundo
   escuro, precisa ser claro) e --rose-ink (itálico dos títulos no papel, precisa ser
   escuro). A partir de uma cor qualquer, clareia ou escurece até cada uso ficar legível. */

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mix = (c: number[], to: number, t: number) => c.map((v) => v + (to - v) * t);

export function brandPalette(hex: string) {
  const c = hexRgb(hex);
  let light = c;
  for (let t = 0; lum(light) < 0.42 && t <= 1; t += 0.04) light = mix(c, 255, t);
  let ink = c;
  for (let t = 0; lum(ink) > 0.12 && t <= 1; t += 0.04) ink = mix(c, 0, t);
  return { rose: hex, rose2: rgbHex(light), roseInk: rgbHex(ink) };
}

/** aplica a cor da marca do prospect nas variáveis do CSS */
export function applyBrandColor(hex: string) {
  if (!hex || typeof document === 'undefined') return;
  const p = brandPalette(hex);
  const s = document.documentElement.style;
  s.setProperty('--rose', p.rose);
  s.setProperty('--rose-2', p.rose2);
  s.setProperty('--rose-ink', p.roseInk);
}

declare global {
  interface Window {
    __PROSPECT?: Partial<Prospect>;
  }
}

function read(): Prospect {
  if (typeof window === 'undefined') return cleanProspect({});
  const q = new URLSearchParams(window.location.search);
  // fotos e logo só vêm do build (window.__PROSPECT), nunca da URL
  const fromUrl = Object.fromEntries(['bar', 'ig', 'wa', 'cidade', 'cor'].filter((k) => q.get(k)).map((k) => [k, q.get(k)]));
  return cleanProspect({ ...(window.__PROSPECT ?? {}), ...fromUrl });
}

export const prospect = read();
/** há um nome de bar: o site vira "a prévia do site de fulano" */
export const personalized = prospect.bar.length > 0;
