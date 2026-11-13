/**
 * Adiciona, lista ou remove prospects em prospects.json. O build gera a página e a
 * imagem de prévia de cada um (plugin `prospects` em vite.config.ts).
 *
 *   npm run prospect -- --bar "Drinks da Ana" --cidade Curitiba --ig drinksdaana --wa 5541999999999
 *   npm run prospect -- --site https://demo.seudominio.com.br     (uma vez: onde o dist é publicado)
 *   npm run prospect -- --list
 *   npm run prospect -- --remove drinks-da-ana
 *
 * Com --build, já roda o build no final.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const FILE = 'prospects.json';
const args = process.argv.slice(2);
const flag = (k) => args.includes(`--${k}`);
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
};
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const cfg = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { site: '', prospects: [] };
cfg.prospects ??= [];
const save = () => fs.writeFileSync(FILE, `${JSON.stringify(cfg, null, 2)}\n`);
const url = (slug) => (cfg.site ? new URL(`${slug}.html`, cfg.site.replace(/\/?$/, '/')).href : `dist/${slug}.html`);

if (opt('site') !== undefined) {
  cfg.site = opt('site');
  save();
  console.log(`site: ${cfg.site}`);
}

if (flag('list')) {
  if (!cfg.prospects.length) console.log('nenhum prospect ainda');
  for (const p of cfg.prospects) console.log(`${p.slug.padEnd(28)} ${p.bar.padEnd(28)} ${url(p.slug)}`);
}

const remove = opt('remove');
if (remove) {
  const before = cfg.prospects.length;
  cfg.prospects = cfg.prospects.filter((p) => p.slug !== remove);
  save();
  console.log(before === cfg.prospects.length ? `não achei "${remove}"` : `removido: ${remove}`);
}

const bar = opt('bar');
if (bar) {
  const slug = slugify(opt('slug') ?? bar);
  if (!slug) {
    console.error('nome sem letras ou números: use --slug');
    process.exit(1);
  }
  const old = cfg.prospects.find((p) => p.slug === slug);
  const entry = { slug, bar, cidade: opt('cidade') ?? old?.cidade ?? '', ig: opt('ig') ?? old?.ig ?? '', wa: opt('wa') ?? old?.wa ?? '' };
  cfg.prospects = [...cfg.prospects.filter((p) => p.slug !== slug), entry];
  save();
  console.log(`${old ? 'atualizado' : 'adicionado'}: ${bar} → ${url(slug)}`);
  console.log('\nMensagem sugerida para mandar no WhatsApp:\n');
  console.log(`  Oi! Montei uma prévia de como poderia ficar o site de vocês, já com o nome ${bar}: ${url(slug)}`);
  console.log('  Abre no celular e rola a página: o drink é montado na tela. O orçamento e o WhatsApp já funcionam.\n');
  if (!cfg.site) console.log('  (ainda sem --site: o link acima é local; publique o dist e rode com --site para o link e a prévia funcionarem)\n');
}

if (!args.length) console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);

if (flag('build')) execSync('npm run build', { stdio: 'inherit' });
