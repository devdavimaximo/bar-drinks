// Gera os assets de public/media a partir de fotos/ (fotos dos eventos do cliente).
//   npm run images
// Cada foto (.jpg, .jpeg, .png ou .webp) vira WebP em três larguras; o nome do arquivo
// sem extensão é o `src` que vai em content.ts → galeria.photos.
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, 'fotos');
const out = path.join(root, 'public', 'media');
await mkdir(out, { recursive: true });

const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
for (const f of files) {
  const slug = path.parse(f).name;
  for (const [w, q] of [
    [1800, 80],
    [1300, 79],
    [900, 78],
  ]) {
    await sharp(path.join(dir, f))
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: q, smartSubsample: true })
      .toFile(path.join(out, `${slug}-${w}.webp`));
  }
  console.log(`✓ ${slug}`);
}
if (!files.length) console.log('Nenhuma foto em fotos/.');
