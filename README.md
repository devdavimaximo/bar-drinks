# Seu Bar · demonstração para bares de drinks em eventos

Site-modelo para prospecção (mesmo padrão do `docesfinos/`): marca genérica, todo o texto e os dados em `src/content.ts`.

```bash
npm install
npm run dev        # http://localhost:5173  ·  /lab.html = laboratório do 3D
npm run build      # gera dist/ e as prévias de cada prospect
```

## O que tem

- **Hero**: um Gin, Hibisco & Tônica em 3D (raymarching num quad de tela, `src/gl/drinkShader.ts`, desenhado por um renderizador WebGL2 próprio em `src/gl/renderer.ts`) montado pelo scroll em seis tempos: taça, gelo, gin, hibisco, tônica e guarnição. A ficha ao lado mostra a receita, os ml no copo e a temperatura.
- **Carta**: o mesmo shader com cada drink da carta. A taça muda de forma (balão ↔ coupe), de cor e de guarnição. Para mudar a carta, edite `carta` em `content.ts`; o `look` de cada drink define taça, cor, gelo, espuma, rodela, raminho e frutinhas.
- **Drink assinatura** (`Criador.tsx`): o convidado escolhe base, sabor, estilo e guarnição, dá um nome ("Ana & Pedro") e vê o drink em 3D na hora. Pode pedir pelo WhatsApp ou salvar um cartão 1080×1350 para compartilhar (no celular abre o compartilhar do sistema). O drink criado entra no pedido da calculadora. Opções em `criador`, no `content.ts`.
- **Eventos**, **Monte seu bar** (calculadora: bartenders, drinks, gelo, investimento, nome, local e data → WhatsApp), **Galeria e depoimentos**, **FAQ**, **Contato**.

## Prévia personalizada para prospecção

O mesmo site, já com o nome do bar que você vai abordar: no preloader, no hero, no topo, no título da aba e no selo "Prévia do site · Nome".

**Teste rápido**, sem build: `http://localhost:5173/?bar=Drinks+da+Ana&cidade=Curitiba&ig=drinksdaana&wa=5541999999999`

**Link para enviar** (com imagem de prévia no WhatsApp):

```bash
npm run prospect -- --site https://demo.seudominio.com.br   # uma vez: onde o dist é publicado
npm run prospect -- --bar "Drinks da Ana" --cidade Curitiba --ig drinksdaana --wa 5541999999999 --build
npm run prospect -- --list
npm run prospect -- --remove drinks-da-ana
```

Cada prospect fica em `prospects.json` e o build gera `dist/<slug>.html` e `dist/og/<slug>.jpg` (o cartão com o nome do bar e a foto do drink). Publique a pasta `dist/` inteira. O WhatsApp só mostra a imagem quando `site` está preenchido, porque a imagem precisa de endereço absoluto. O comando também sugere a mensagem para mandar.

Os dados aceitos (nome, cidade, Instagram, WhatsApp) passam por limpeza em `src/prospect.ts` e vão para a tela só como texto.

## Para adaptar a um cliente

1. `content.ts`: `brand` (nome, Instagram, WhatsApp), carta, opções do drink assinatura, pacotes e valores (`monte`), FAQ. Tudo que é ilustrativo está marcado com `DEMO`.
2. Fotos: coloque em `fotos/`, rode `npm run images` e preencha `src` em `galeria.photos`.
3. Depoimentos: troque pelos reais e remova o aviso "Depoimentos ilustrativos" em `Galeria.tsx`.

## Laboratório

`/lab.html?p=0.5` mostra a montagem num ponto fixo (slider embaixo). `/lab.html?d=clover` mostra um drink da carta pelo `slug`.
