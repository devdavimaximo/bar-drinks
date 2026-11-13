import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { brand } from './src/content';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * O preloader nasce no HTML (pinta antes do JS) com o nome que está em content.ts,
 * e as fontes da primeira tela vão com preload: a bolacha e o título do hero já
 * aparecem na Bodoni, sem trocar de fonte no meio da abertura.
 */
function preloader(): Plugin {
  const word = brand.name
    .toUpperCase()
    .split('')
    .map((c, i) => `<span class="preloader__char" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`)
    .join('');
  const html = `<div class="preloader" id="preloader" role="status" aria-label="Carregando ${esc(brand.name)}">
      <div class="preloader__curtain"></div>
      <div class="preloader__center">
        <div class="preloader__mark">
          <span class="preloader__fill" aria-hidden="true"></span>
          <svg class="mono preloader__mono" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle class="mono__ring" cx="32" cy="32" r="30" />
            <path d="M18 21h28c0 7-6.3 12.5-14 12.5S18 28 18 21z M32 33.5V46 M24.5 46h15" />
            <path d="M21.5 24h21" opacity="0.6" />
          </svg>
        </div>
        <p class="preloader__word" aria-hidden="true">${word}</p>
        <p class="preloader__sub">${esc(brand.descriptor)}</p>
      </div>
    </div>`;

  const FONTS = [/bodoni-moda-latin-opsz-normal.*\.woff2$/, /bodoni-moda-latin-opsz-italic.*\.woff2$/, /manrope-latin-wght-normal.*\.woff2$/];

  return {
    name: 'preloader',
    transformIndexHtml(src, ctx) {
      const out = src.replace('<!--preloader-->', html);
      const files = ctx.bundle ? Object.keys(ctx.bundle) : [];
      const tags = FONTS.map((re) => files.find((f) => re.test(f)))
        .filter((f): f is string => !!f)
        .map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `./${f}`, crossorigin: '' },
          injectTo: 'head-prepend' as const,
        }));
      return { html: out, tags };
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), preloader()],
});
