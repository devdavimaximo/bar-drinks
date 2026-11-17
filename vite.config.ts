import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { brand } from './src/content';
import { brandPalette, cleanProspect } from './src/prospect';
import { ogImage } from './scripts/og.mjs';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * Prévia personalizada (src/prospect.ts): o nome do prospect entra na bolacha antes
 * do primeiro quadro, sem esperar o React. Mesma limpeza e mesma precedência do
 * prospect.ts (URL vence window.__PROSPECT). Só textContent, nunca HTML.
 */
const PROSPECT_NAME = `(function(){try{
var p=window.__PROSPECT||{},q=new URLSearchParams(location.search);
var el=document.getElementById('preloader');
var c=String(q.get('cor')||p.cor||'').trim().replace(/^#?/,'#');
if(/^#[0-9a-f]{6}$/i.test(c)){
  var L=function(x){return x.map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce(function(a,v,i){return a+v*[.2126,.7152,.0722][i]},0)};
  var rgb=[1,3,5].map(function(i){return parseInt(c.substr(i,2),16)}),l=rgb,t=0;
  while(L(l)<.42&&t<=1){l=rgb.map(function(v){return v+(255-v)*t});t+=.04;}
  document.documentElement.style.setProperty('--rose-2','rgb('+l.map(Math.round).join(',')+')');
}
if(/^media\\/p\\/[a-z0-9-]+\\/logo\\.(png|svg)$/.test(String(p.logo||''))){
  var m=el.querySelector('.preloader__mark'),img=document.createElement('img');
  img.className='preloader__logo';img.alt='';img.src='./'+p.logo;m.textContent='';m.appendChild(img);
}
var b=String(q.get('bar')||p.bar||'').replace(/[\\u0000-\\u001f<>]/g,'').replace(/\\s+/g,' ').trim().slice(0,32);
if(!b)return;
var w=el.querySelector('.preloader__word');
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
      // sem cena de abertura: o hero aparece direto (o preloader travava a entrada)
      const out = src.replace('<!--preloader-->', '');
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

const OG_PHOTO = 'fotos/renan.jpg';

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
 * Fotos e logo do prospect: tudo o que estiver em prospects/<slug>/ (pasta fora do git).
 *   - até 6 fotos (.jpg, .png, .webp, em ordem de nome) → dist/media/p/<slug>/<n>-900|1300|1800.webp,
 *     as mesmas larguras que scripts/images.mjs gera para a galeria
 *   - logo.png | logo.jpg | logo.webp | logo.svg → dist/media/p/<slug>/logo.png|svg
 */
async function prospectMedia(slug: string, outDir: string) {
  const dir = path.resolve('prospects', slug);
  const none = { fotos: [] as string[], logo: '', logoFile: '', cover: '' };
  if (!fs.existsSync(dir)) return none;
  const sharp = (await import('sharp')).default;
  const files = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  const out = path.join(outDir, 'media', 'p', slug);
  fs.mkdirSync(out, { recursive: true });

  const photos = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !/^logo\./i.test(f)).slice(0, 6);
  const fotos: string[] = [];
  for (const [i, f] of photos.entries()) {
    for (const [w, q] of [
      [1800, 80],
      [1300, 79],
      [900, 78],
    ])
      await sharp(path.join(dir, f))
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: q, smartSubsample: true })
        .toFile(path.join(out, `${i + 1}-${w}.webp`));
    fotos.push(`p/${slug}/${i + 1}`);
  }

  let logo = '';
  let logoFile = '';
  const lf = files.find((f) => /^logo\.(png|jpe?g|webp|svg)$/i.test(f));
  if (lf) {
    logoFile = path.join(dir, lf);
    if (/\.svg$/i.test(lf)) {
      fs.copyFileSync(logoFile, path.join(out, 'logo.svg'));
      logo = `media/p/${slug}/logo.svg`;
    } else {
      await sharp(logoFile).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(out, 'logo.png'));
      logo = `media/p/${slug}/logo.png`;
    }
  }
  return { fotos, logo, logoFile, cover: photos[0] ? path.join(dir, photos[0]) : '' };
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

      // imagens (sharp) nunca derrubam o build: sem elas o site e as páginas saem do mesmo jeito
      const warned = new Set<string>();
      const safe = async <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
        try {
          return await fn();
        } catch (e) {
          const msg = (e as Error).message.split('\n')[0];
          if (!warned.has(msg)) console.warn(`\x1b[33m  ${label} não gerada: ${msg}\x1b[0m`);
          warned.add(msg);
          return undefined;
        }
      };

      // a página principal também ganha imagem de prévia
      const siteOg = await safe('imagem de prévia', () =>
        ogImage({ name: brand.name, line: brand.descriptor, photo: OG_PHOTO, out: path.join(outDir, 'og', 'site.jpg'), kicker: 'DEMONSTRAÇÃO DE SITE' }).then(() => true),
      );
      if (siteOg) index = setMeta(index, 'property', 'og:image', abs('og/site.jpg'));
      index = setMeta(index, 'name', 'twitter:card', 'summary_large_image');
      fs.writeFileSync(indexPath, index);

      const list: Record<string, unknown>[] = Array.isArray(cfg.prospects) ? cfg.prospects : [];
      const made: string[] = [];
      for (const raw of list) {
        const slug = slugify(String(raw.slug || raw.bar || ''));
        if (!slug || slug === 'index') continue;
        const media = (await safe('fotos/logo do prospect', () => prospectMedia(slug, outDir))) ?? { fotos: [], logo: '', logoFile: '', cover: '' };
        const p = cleanProspect({ ...raw, fotos: media.fotos, logo: media.logo });
        if (!p.bar) continue;
        const title = `${p.bar} · Prévia do site`;
        const desc = `Prévia do site para ${p.bar}. Role a página e veja o drink ser montado em 3D.`;
        let html = index.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
        html = setMeta(html, 'name', 'description', desc);
        html = setMeta(html, 'property', 'og:title', title);
        html = setMeta(html, 'property', 'og:description', desc);
        if (siteOg) html = setMeta(html, 'property', 'og:image', abs(`og/${slug}.jpg`));
        if (site) html = setMeta(html, 'property', 'og:url', abs(`${slug}.html`));
        // antes de tudo: o script da bolacha e o app leem daqui (JSON com < escapado)
        const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
        const boot = [`window.__PROSPECT=${json(p)}`];
        // aviso de abertura (src/lib/track.ts): só https
        if (notify) boot.push(`window.__TRACK=${json({ url: notify, slug })}`);
        html = html.replace('<head>', `<head>\n    <script>${boot.join(';')}</script>`);
        fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
        const line = p.cidade ? `Coquetelaria para eventos · ${p.cidade}` : 'Coquetelaria para eventos';
        // a prévia do link já mostra a foto, a logo e a cor do próprio prospect, quando existem
        if (siteOg)
          await safe('imagem de prévia', () =>
            ogImage({
              name: p.bar,
              line,
              photo: media.cover || OG_PHOTO,
              logo: media.logoFile,
              accent: p.cor ? brandPalette(p.cor).rose2 : undefined,
              out: path.join(outDir, 'og', `${slug}.jpg`),
            }),
          );
        const extras = [media.fotos.length && `${media.fotos.length} fotos`, p.logo && 'logo', p.cor && `cor ${p.cor}`].filter(Boolean).join(', ');
        made.push(`  ${p.bar.padEnd(28)} ${abs(`${slug}.html`)}${extras ? `  (${extras})` : ''}`);
      }

      if (made.length) console.log(`\n\x1b[35mprévias\x1b[0m (${made.length})${notify ? ' · com aviso de abertura' : ''}\n${made.join('\n')}`);
      if (!site) console.log('\x1b[33m  sem "site" em prospects.json: a imagem de prévia não aparece no WhatsApp até preencher\x1b[0m');
    },
  };
}

/**
 * Só no `npm run dev`: o laboratório (/lab.html?poster=desktop) fotografa o primeiro
 * quadro do hero e manda para cá; vira public/media/poster-<nome>.webp, a foto que
 * aparece no lugar do 3D enquanto o shader compila (ver Hero.tsx).
 */
function posterSaver(): Plugin {
  return {
    name: 'poster-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__poster', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? '';
        if (req.method !== 'POST' || !/^[a-z0-9-]{1,20}$/.test(name)) {
          res.statusCode = 400;
          return res.end('nome inválido');
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          const data = Buffer.concat(chunks).toString().replace(/^data:image\/\w+;base64,/, '');
          const sharp = (await import('sharp')).default;
          const out = path.resolve('public/media', `poster-${name}.webp`);
          await sharp(Buffer.from(data, 'base64')).webp({ quality: 74, smartSubsample: true }).toFile(out);
          console.log(`poster salvo: ${out}`);
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), preloader(), prospects(), posterSaver()],
});
