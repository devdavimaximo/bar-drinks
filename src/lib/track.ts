import { brand } from '../content';

/**
 * Aviso de abertura da prévia: quando o prospect abre o link, quem prospecta recebe
 * uma notificação (ex.: ntfy.sh no celular). Só existe nas páginas geradas por
 * prospects.json com `notify` preenchido (window.__TRACK, injetado no build).
 *
 * Manda só eventos em texto: abriu, chegou na calculadora ou no drink assinatura,
 * clicou no WhatsApp, quanto tempo ficou. Nada sobre quem visita (sem cookie, sem
 * identificador, sem IP guardado aqui). Desligado:
 *   - no modo apresentação (?pitch=1), que é você mostrando
 *   - no seu aparelho: abra uma vez com ?eu=1 (?eu=0 desfaz)
 */

declare global {
  interface Window {
    __TRACK?: { url: string; slug: string };
  }
}

const params = new URLSearchParams(window.location.search);
export const PITCH = params.has('pitch');

function isMe() {
  try {
    if (params.get('eu') === '1') localStorage.setItem('prospect:eu', '1');
    if (params.get('eu') === '0') localStorage.removeItem('prospect:eu');
    return localStorage.getItem('prospect:eu') === '1';
  } catch {
    return false;
  }
}

const cfg = window.__TRACK;
// sempre lê (e grava) ?eu=: também precisa funcionar junto com ?pitch=1
const ME = isMe();
const ON = !!cfg && /^https:\/\//.test(cfg.url) && !PITCH && !ME;
const sent = new Set<string>();

/** uma vez por evento por visita; texto puro, sem cabeçalhos (não dispara preflight de CORS) */
export function track(key: string, text: string) {
  if (!ON || sent.has(key)) return;
  sent.add(key);
  fetch(cfg!.url, { method: 'POST', body: text, keepalive: true, mode: 'no-cors' }).catch(() => {});
}

const fmt = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

/** liga os avisos: abertura, seções importantes, cliques no WhatsApp e saída */
export function startTracking(sections: { id: string; label: string }[]) {
  if (!ON) return () => {};
  const t0 = performance.now();
  const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'no celular' : 'no computador';
  let deepest = 'o início';
  let deepestIndex = -1;

  track('open', `👀 ${brand.name} abriu a prévia do site ${device}`);

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = sections.findIndex((s) => s.id === e.target.id);
        if (i > deepestIndex) {
          deepestIndex = i;
          deepest = sections[i].label;
        }
        if (e.target.id === 'criador') track('reach:criador', `🍸 ${brand.name} chegou no drink assinatura`);
        if (e.target.id === 'monte') track('reach:monte', `🧮 ${brand.name} chegou na calculadora de orçamento`);
      }
    },
    { threshold: 0.25 },
  );
  sections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) io.observe(el);
  });

  // links diretos para o WhatsApp (contato, cabeçalho); os botões passam por sendOrder
  const click = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest?.('a[href*="wa.me"]')) onWhatsApp();
  };
  document.addEventListener('click', click, true);

  // celular raramente dispara "unload": a aba sumir de vista é o sinal de saída
  const leave = () => {
    if (document.visibilityState === 'hidden') track('leave', `⏱ ${brand.name} ficou ${fmt(performance.now() - t0)} na prévia e chegou até: ${deepest}`);
  };
  document.addEventListener('visibilitychange', leave);

  return () => {
    io.disconnect();
    document.removeEventListener('click', click, true);
    document.removeEventListener('visibilitychange', leave);
  };
}

export const onWhatsApp = () => track('whatsapp', `💬 ${brand.name} clicou para pedir pelo WhatsApp`);
export const onShare = () => track('share', `📸 ${brand.name} gerou o cartão do drink assinatura`);
