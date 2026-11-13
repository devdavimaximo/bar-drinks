import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { brand, criador, type Look } from '../content';
import { useReveal } from '../lib/reveal';
import { sendOrder, showToast } from '../lib/order';
import { setSignature } from '../lib/signature';
import { onShare } from '../lib/track';
import type { Snapshot } from '../gl/Drink';

const Drink = lazy(() => import('../gl/Drink'));

const LEMON = { pulp: '#f3e27a', rind: '#e2c22e' };
const LIME = { pulp: '#cfe08a', rind: '#4f7d22' };

type Flavor = (typeof criador.flavors)[number];
type Style = (typeof criador.styles)[number];

/** as escolhas viram a aparência no 3D: taça, cor, gelo, espuma e guarnição */
function lookFor(flavor: Flavor, style: Style, garnish: string[]): Look {
  const long = style.id === 'long';
  const has = (id: string) => garnish.includes(id);
  const wheel = has('siciliano') ? LEMON : has('taiti') ? LIME : null;
  return {
    glass: long ? 'copa' : 'coupe',
    color: flavor.color,
    bottom: long ? flavor.bottom : undefined,
    fill: long ? 0.78 : 0.86,
    // batido fica turvo, mas sem apagar a cor do sabor
    cloud: Math.min(0.7, ((flavor as { cloud?: number }).cloud ?? 0) + (long ? 0 : 0.3)),
    foam: long ? 0 : 0.045,
    bubbles: long ? 1 : 0,
    ice: long,
    wheel: wheel ? { ...wheel, float: !long } : undefined,
    sprig: has('alecrim') ? '#2f4a2a' : has('hortela') ? '#3e7a34' : undefined,
    berries: has('frutinhas') ? { color: flavor.berry, size: long ? 0.03 : 0.04 } : undefined,
  };
}

/** quebra o texto em linhas que cabem em `max` px no canvas */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** o cartão 1080×1350 (formato de post e status): o drink, o nome e a receita */
async function makeCard(photo: string, name: string, recipe: string, garnish: string) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#070b0a';
  ctx.fillRect(0, 0, W, H);

  const img = new Image();
  img.src = photo;
  await img.decode();
  // cobre o cartão inteiro, com a taça um pouco acima do centro
  const k = Math.max(W / img.width, H / img.height);
  ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2 - 90, img.width * k, img.height * k);

  const fade = ctx.createLinearGradient(0, H * 0.48, 0, H);
  fade.addColorStop(0, 'rgba(7,11,10,0)');
  fade.addColorStop(0.45, 'rgba(7,11,10,0.86)');
  fade.addColorStop(1, 'rgba(7,11,10,0.98)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  const X = 84;
  const serif = '"Bodoni Moda Variable", "Didot", "Times New Roman", serif';
  const sans = '"Manrope Variable", system-ui, sans-serif';

  // de baixo para cima: rodapé, guarnição, receita, nome, rótulo
  let y = H - 84;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(239,231,218,0.45)';
  ctx.font = `500 24px ${sans}`;
  ctx.letterSpacing = '4px';
  ctx.fillText(`${criador.cardFooter.toUpperCase()} · ${brand.name.toUpperCase()}`, X, y);
  ctx.letterSpacing = '0px';

  y -= 70;
  ctx.fillStyle = 'rgba(239,231,218,0.72)';
  ctx.font = `400 30px ${sans}`;
  for (const l of wrap(ctx, garnish, W - X * 2).reverse()) {
    ctx.fillText(l, X, y);
    y -= 42;
  }

  y -= 6;
  // o tom de destaque do site (numa prévia, a cor da marca do prospect)
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--rose-2').trim() || '#ef9fb5';
  ctx.font = `italic 400 40px ${serif}`;
  for (const l of wrap(ctx, recipe, W - X * 2).reverse()) {
    ctx.fillText(l, X, y);
    y -= 52;
  }

  y -= 30;
  ctx.fillStyle = '#efe7da';
  let size = 128;
  ctx.font = `400 ${size}px ${serif}`;
  while (ctx.measureText(name).width > W - X * 2 && size > 64) {
    size -= 4;
    ctx.font = `400 ${size}px ${serif}`;
  }
  const nameLines = wrap(ctx, name, W - X * 2);
  for (const l of nameLines.reverse()) {
    ctx.fillText(l, X - 4, y);
    y -= size * 1.02;
  }

  y -= 6;
  ctx.fillStyle = '#d6b87f';
  ctx.font = `600 24px ${sans}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('DRINK ASSINATURA', X, y);
  ctx.letterSpacing = '0px';

  return new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.9));
}

export default function Criador() {
  const root = useRef<HTMLElement>(null);
  const snap = useRef<Snapshot | null>(null);
  const [name, setName] = useState('');
  const [base, setBase] = useState(criador.bases[0]);
  const [flavor, setFlavor] = useState<Flavor>(criador.flavors[0]);
  const [style, setStyle] = useState<Style>(criador.styles[0]);
  const [garnish, setGarnish] = useState<string[]>(['siciliano', 'alecrim']);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  useReveal(root);

  const look = useMemo(() => lookFor(flavor, style, garnish), [flavor, style, garnish]);
  const title = name.trim() || criador.fallbackName;
  const recipe = `${base} · ${flavor.name} · ${style.name.toLowerCase()}, ${style.text}`;
  const garnishText = garnish.length
    ? `Guarnição: ${new Intl.ListFormat('pt-BR').format(criador.garnishes.filter((g) => garnish.includes(g.id)).map((g) => g.name.toLowerCase()))}`
    : 'Sem guarnição';

  // depois do primeiro toque, o drink vai junto no pedido da calculadora
  useEffect(() => {
    if (touched) setSignature({ name: title, recipe: `${recipe}. ${garnishText}` });
  }, [touched, title, recipe, garnishText]);

  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    setTouched(true);
    fn(v);
  };

  const flipGarnish = touch((id: string) => {
    const group = criador.garnishes.find((g) => g.id === id)!.group;
    setGarnish((xs) =>
      xs.includes(id) ? xs.filter((x) => x !== id) : [...xs.filter((x) => criador.garnishes.find((g) => g.id === x)!.group !== group), id],
    );
  });

  const order = () =>
    sendOrder(
      [`Olá, ${brand.name}! Criei um drink assinatura no site:`, `• Nome: ${title}`, `• ${recipe}`, `• ${garnishText}`, 'Quero esse drink no meu evento. Data: '].join('\n'),
    );

  const share = async () => {
    const photo = snap.current?.(1080);
    if (!photo) return showToast('O drink ainda está carregando. Tente de novo em um instante.');
    setBusy(true);
    try {
      await document.fonts?.ready;
      const blob = await makeCard(photo, title, recipe, garnishText);
      if (!blob) throw new Error('sem imagem');
      onShare();
      const file = new File([blob], `drink-${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.jpg`, { type: 'image/jpeg' });
      // no celular abre o compartilhar do sistema (WhatsApp, Instagram); no desktop, baixa
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: `${title}: o drink do nosso evento, por ${brand.name}` });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        showToast('Imagem salva. É só mandar para quem vai brindar com vocês.');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') showToast('Não deu para gerar a imagem neste navegador.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="criador" id="criador" ref={root} data-tone="dark">
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">VI</span> {criador.label}
        </p>
        <p className="eyebrow">Simulação 3D · monte e compartilhe</p>
      </div>

      <div className="criador__grid">
        <div className="criador__slot">
          <figure className="criador__stage">
            <Suspense fallback={<div className="criador__gl" />}>
              <Drink mode={{ kind: 'card', look }} className="criador__gl" snap={snap} />
            </Suspense>
            <figcaption className="criador__cap">
              <p className="eyebrow eyebrow--gold">Drink assinatura</p>
              <h3 className={`criador__name ${name.trim() ? '' : 'is-empty'}`}>{title}</h3>
              <p className="criador__recipe">
                <em>{recipe}</em>
              </p>
            </figcaption>
          </figure>
        </div>

        <div className="criador__copy">
          <h2 className="display criador__title" data-split>
            {criador.title[0]} <em>{criador.title[1]}</em>
          </h2>
          <p className="criador__body" data-rise>
            {criador.body}
          </p>

          <div className="mix" data-rise>
            <label className="mix__label" htmlFor="drink-name">
              Nome do drink
            </label>
            <input
              id="drink-name"
              className="mix__name"
              value={name}
              maxLength={28}
              placeholder={criador.namePlaceholder}
              autoComplete="off"
              onChange={(e) => touch(setName)(e.target.value)}
            />
          </div>

          <div className="mix" data-rise>
            <p className="mix__label">Base</p>
            <div className="chips" role="radiogroup" aria-label="Base">
              {criador.bases.map((b) => (
                <button key={b} role="radio" aria-checked={base === b} className={`chip ${base === b ? 'is-on' : ''}`} onClick={() => touch(setBase)(b)}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="mix" data-rise>
            <p className="mix__label">Sabor e cor</p>
            <div className="chips" role="radiogroup" aria-label="Sabor">
              {criador.flavors.map((f) => (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={flavor.id === f.id}
                  className={`chip chip--swatch ${flavor.id === f.id ? 'is-on' : ''}`}
                  onClick={() => touch(setFlavor)(f)}
                  data-cursor="servir"
                >
                  <i style={{ background: f.color }} aria-hidden="true" />
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mix" data-rise>
            <p className="mix__label">Estilo</p>
            <div className="chips chips--wide" role="radiogroup" aria-label="Estilo">
              {criador.styles.map((s) => (
                <button key={s.id} role="radio" aria-checked={style.id === s.id} className={`chip chip--card ${style.id === s.id ? 'is-on' : ''}`} onClick={() => touch(setStyle)(s)}>
                  <b>{s.name}</b>
                  <small>{s.text}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="mix" data-rise>
            <p className="mix__label">Guarnição</p>
            <div className="chips" role="group" aria-label="Guarnição">
              {criador.garnishes.map((g) => (
                <button key={g.id} aria-pressed={garnish.includes(g.id)} className={`chip ${garnish.includes(g.id) ? 'is-on' : ''}`} onClick={() => flipGarnish(g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="criador__actions" data-rise>
            <button className="btn btn--rose btn--lg" onClick={order} data-cursor="pedir">
              Quero esse drink no meu evento
            </button>
            <button className="btn btn--line btn--lg" onClick={share} disabled={busy} data-cursor="salvar">
              {busy ? 'Gerando imagem…' : 'Salvar e compartilhar'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
