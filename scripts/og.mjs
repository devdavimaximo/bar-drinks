/**
 * Imagem de prévia do link (og:image, 1200×630): é o cartão que aparece no WhatsApp
 * antes do prospect abrir o site. Painel escuro com o nome do bar em Bodoni e a foto
 * do drink-assinatura à direita.
 *
 * O texto vira contorno vetorial (opentype.js) antes de ir para o sharp: assim a
 * Bodoni sai certa em qualquer máquina, sem depender de fonte instalada no sistema
 * (o sharp no Windows ignora `fontfile`). Kerning desligado: no opentype.js 2 ele
 * quebra alguns glifos (Ç, o "a" itálico depois do "p").
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const W = 1200;
const H = 630;
const FONT_DIR = path.join(path.dirname(require.resolve('@fontsource/bodoni-moda/package.json')), 'files');
const load = (f) => opentype.parse(fs.readFileSync(path.join(FONT_DIR, f)).buffer);
const fonts = {
  regular: load('bodoni-moda-latin-400-normal.woff'),
  italic: load('bodoni-moda-latin-400-italic.woff'),
  medium: load('bodoni-moda-latin-500-normal.woff'),
};
const OPT = { kerning: false, features: { liga: false, rlig: false } };

const width = (font, text, size, letterSpacing = 0) => font.getAdvanceWidth(text, size, { ...OPT, letterSpacing });

/**
 * Um <path> por glifo, com o contorno em unidades inteiras da fonte e a posição e
 * a escala num transform. Coordenadas já escaladas e arredondadas em pixel faziam
 * o librsvg errar o preenchimento de alguns glifos dependendo da posição na tela.
 */
function text(font, str, x, y, size, fill, letterSpacing = 0) {
  const k = size / font.unitsPerEm;
  let pen = 0;
  return font
    .stringToGlyphs(str, OPT)
    .map((g) => {
      const d = g.getPath(0, 0, font.unitsPerEm).toPathData(0);
      const tx = (x + pen * k).toFixed(2);
      pen += g.advanceWidth + letterSpacing * font.unitsPerEm;
      return d ? `<path transform="translate(${tx} ${y.toFixed(2)}) scale(${k.toFixed(5)})" d="${d}" fill="${fill}"/>` : '';
    })
    .join('');
}

/** maior tamanho (até `max`) em que o texto cabe em `room` px */
const fit = (font, str, room, max) => Math.min(max, Math.floor((max * room) / Math.max(width(font, str, max), 1)));

/**
 * @param {{ name: string, line: string, photo: string, out: string, kicker?: string, logo?: string, accent?: string }} o
 *   logo: arquivo da logo do prospect (vai num disco claro no lugar da bolacha)
 *   accent: cor da linha em itálico (numa prévia, a cor da marca do prospect)
 */
export async function ogImage({ name, line, photo, out, kicker = 'PRÉVIA DO SITE', logo, accent = '#ef9fb5' }) {
  const PAD = 84;
  const ROOM = 600;
  const size = fit(fonts.regular, name, ROOM, 104);
  // nome longo: duas linhas, cortado no espaço mais perto do meio
  let lines = [name];
  if (size < 72 && name.includes(' ')) {
    const mid = name.length / 2;
    const cut = [...name.matchAll(/ /g)].map((m) => m.index).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    lines = [name.slice(0, cut), name.slice(cut + 1)];
  }
  const nameSize = Math.min(...lines.map((l) => fit(fonts.regular, l, ROOM, 104)));
  const lead = nameSize * 1.02;
  const blockH = lead * lines.length;
  const top = H / 2 - blockH / 2 + nameSize * 0.72;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#0b110f" stop-opacity="1"/>
        <stop offset="0.5" stop-color="#0b110f" stop-opacity="0.96"/>
        <stop offset="0.66" stop-color="#0b110f" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#0b110f" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.22" cy="0.55" r="0.6">
        <stop offset="0" stop-color="#16211d"/>
        <stop offset="1" stop-color="#0b110f" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#fade)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${
      logo
        ? `<circle cx="${PAD + 29}" cy="${PAD + 21}" r="34" fill="#efe7da"/>`
        : `<g transform="translate(${PAD} ${PAD - 8}) scale(0.9)" fill="none" stroke="#d6b87f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="32" cy="32" r="30"/>
      <path d="M18 21h28c0 7-6.3 12.5-14 12.5S18 28 18 21z M32 33.5V46 M24.5 46h15"/>
    </g>`
    }
    ${text(fonts.medium, kicker, PAD, top - nameSize * 0.95, 17, '#d6b87f', 0.28)}
    ${lines.map((l, i) => text(fonts.regular, l, PAD - 3, top + i * lead, nameSize, '#efe7da')).join('')}
    ${text(fonts.italic, line, PAD, top + blockH - lead + nameSize * 0.62, 34, accent)}
    <rect x="${PAD}" y="${H - PAD - 1}" width="40" height="1" fill="#d6b87f"/>
    ${text(fonts.italic, 'Toque para abrir · o drink é montado em 3D', PAD + 56, H - PAD + 6, 20, 'rgba(239,231,218,0.72)')}
  </svg>`;

  // a foto ocupa a metade direita; recorte pela região com mais detalhe, porque
  // a foto pode ser a do drink da demonstração ou uma qualquer do prospect
  const pic = await sharp(photo).rotate().resize(640, H, { fit: 'cover', position: sharp.strategy.attention }).toBuffer();
  const layers = [
    { input: pic, left: W - 640, top: 0 },
    { input: Buffer.from(svg), left: 0, top: 0 },
  ];
  if (logo) {
    const mark = await sharp(logo).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    layers.push({ input: mark, left: PAD + 29 - 24, top: PAD + 21 - 24 });
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 3, background: '#0b110f' } })
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
}
