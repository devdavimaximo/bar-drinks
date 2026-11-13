import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { brand } from './src/content';
import { cleanProspect } from './src/prospect';
import { ogImage } from './scripts/og.mjs';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * Prévia personalizada (src/prospect.ts): o nome do prospect entra na bolacha antes
 * do primeiro quadro, sem esperar o React. Mesma limpeza e mesma precedência do
 * prospect.ts (URL vence window.__PROSPECT). Só textContent, nunca HTML.
 */
const PROSPECT_NAME = `(function(){try{
var p=window.__PROSPECT||{},q=new URLSearchParams(location.search);
var b=String(q.get('bar')||p.bar||'').replace(/[\\u0000-\\u001f<>]/g,'').replace(/\\s+/g,' ').trim().slice(0,32);
if(!b)return;
var el=document.getElementById('preloader'),w=el.querySelector('.preloader__word');
w.textContent='';
b.toUpperCase().split('').forEach(function(c,i){var s=document.createElement('span');s.className='preloader__char';s.style.setProperty('--i',i);s.textContent=c===' '?'\\u00a0':c;w.appendChild(s);});
el.setAttribute('aria-label','Carregando '+b);
document.title=b+' · Prévia do site';
}catch(e){}})();`;

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
    </div>
    <script>${PROSPECT_NAME}</script>`;

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

/* ---------- prévias personalizadas (prospects.json) ---------- */

const OG_PHOTO = 'fotos/assinatura.jpg';

const slugify =(s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

/** troca (ou cria) uma <meta> do <head> */
function setMeta(html: string, attr: 'name' | 'property', key: string, value: string) {
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  const re = new RegExp(`<meta ${attr}="${key}"[^>]*>`);
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

/**
 * Depois do build, cada prospect vira uma página própria (dist/<slug>.html) com o
 * nome dele no título, na bolacha e no site inteiro (window.__PROSPECT) e uma
 * imagem de prévia (dist/og/<slug>.jpg). É essa imagem que aparece no WhatsApp
 * quando o link é enviado: o crawler do WhatsApp não roda JS, por isso o HTML já
 * sai pronto. A página fica na raiz do dist para os caminhos relativos funcionarem.
 */
function prospects(): Plugin {
  let outDir = 'dist';
  return {
    name: 'prospects',
    apply: 'build',
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
    },
    async closeBundle() {
      const file = path.resolve('prospects.json');
      const cfg = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
      const site: string = cfg.site ? String(cfg.site).replace(/\/?$/, '/') : '';
      const abs = (p: string) => (site ? new URL(p, site).href : `./${p}`);
      const notify: string = /^https:\/\/[^\s"'<>]+$/.test(String(cfg.notify ?? '')) ? cfg.notify : '';
      const indexPath = path.join(outDir, 'index.html');
      let index = fs.readFileSync(indexPath, 'utf8');

      // a página principal também ganha imagem de prévia
      await ogImage({ name: brand.name, line: brand.descriptor, photo: OG_PHOTO, out: path.join(outDir, 'og', 'site.jpg'), kicker: 'DEMONSTRAÇÃO DE SITE' });
      index = setMeta(index, 'property', 'og:image', abs('og/site.jpg'));
      index = setMeta(index, 'name', 'twitter:card', 'summary_large_image');
      fs.writeFileSync(indexPath, index);

      const list: Record<string, unknown>[] = Array.isArray(cfg.prospects) ? cfg.prospects : [];
      const made: string[] = [];
      for (const raw of list) {
        const p = cleanProspect(raw);
        const slug = slugify(String(raw.slug || p.bar));
        if (!p.bar || !slug || slug === 'index') continue;
        const title = `${p.bar} · Prévia do site`;
        const desc = `Prévia do site para ${p.bar}. Role a página e veja o drink ser montado em 3D.`;
        let html = index.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
        html = setMeta(html, 'name', 'description', desc);
        html = setMeta(html, 'property', 'og:title', title);
        html = setMeta(html, 'property', 'og:description', desc);
        html = setMeta(html, 'property', 'og:image', abs(`og/${slug}.jpg`));
        if (site) html = setMeta(html, 'property', 'og:url', abs(`${slug}.html`));
        // antes de tudo: o script da bolacha e o app leem daqui (JSON com < escapado)
        const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
        const boot = [`window.__PROSPECT=${json(p)}`];
        // aviso de abertura (src/lib/track.ts): só https
        if (notify) boot.push(`window.__TRACK=${json({ url: notify, slug })}`);
        html = html.replace('<head>', `<head>\n    <script>${boot.join(';')}</script>`);
        fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
        const line = p.cidade ? `Coquetelaria para eventos · ${p.cidade}` : 'Coquetelaria para eventos';
        await ogImage({ name: p.bar, line, photo: OG_PHOTO, out: path.join(outDir, 'og', `${slug}.jpg`) });
        made.push(`  ${p.bar.padEnd(28)} ${abs(`${slug}.html`)}`);
      }

      if (made.length) console.log(`\n\x1b[35mprévias\x1b[0m (${made.length})${notify ? ' · com aviso de abertura' : ''}\n${made.join('\n')}`);
      if (!site) console.log('\x1b[33m  sem "site" em prospects.json: a imagem de prévia não aparece no WhatsApp até preencher\x1b[0m');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), preloader(), prospects()],
});
