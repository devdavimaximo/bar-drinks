# Seu Bar · demonstração para bares de drinks em eventos

Site-modelo para prospecção (mesmo padrão do `docesfinos/`): marca genérica, todo o texto e os dados em `src/content.ts`.

```bash
npm install
npm run dev        # http://localhost:5173  ·  /lab.html = laboratório do 3D
npm run build
```

## O que tem

- **Hero**: um Gin, Hibisco & Tônica em 3D (raymarching num quad de tela, `src/gl/drinkShader.ts`) montado pelo scroll em seis tempos: taça, gelo, gin, hibisco, tônica e guarnição. A ficha ao lado mostra a receita, os ml no copo e a temperatura.
- **Carta**: o mesmo shader com cada drink da carta. A taça muda de forma (balão ↔ coupe), de cor e de guarnição. Para mudar a carta, edite `carta` em `content.ts`; o `look` de cada drink define taça, cor, gelo, espuma, rodela, raminho e frutinhas.
- **Eventos**, **Monte seu bar** (calculadora: bartenders, drinks, gelo, investimento → WhatsApp), **Galeria e depoimentos**, **FAQ**, **Contato**.

## Para adaptar a um cliente

1. `content.ts`: `brand` (nome, Instagram, WhatsApp), carta, pacotes e valores (`monte`), FAQ. Tudo que é ilustrativo está marcado com `DEMO`.
2. Fotos: coloque em `fotos/`, rode `npm run images` e preencha `src` em `galeria.photos`.
3. Depoimentos: troque pelos reais e remova o aviso "Depoimentos ilustrativos" em `Galeria.tsx`.

## Laboratório

`/lab.html?p=0.5` mostra a montagem num ponto fixo (slider embaixo). `/lab.html?d=clover` mostra um drink da carta pelo `slug`.
