# Seu Bar · demonstração para bares de drinks em eventos

Site-modelo para prospecção (mesmo padrão do `docesfinos/`): marca genérica, todo o texto e os dados em `src/content.ts`.

```bash
npm install
npm run dev        # http://localhost:5173  ·  /lab.html = laboratório do 3D
npm run build      # gera dist/ e as prévias de cada prospect
```

## O que tem

- **Hero**: um Gin, Hibisco & Tônica em 3D (raymarching num quad de tela, `src/gl/drinkShader.ts`, desenhado por um renderizador WebGL2 próprio em `src/gl/renderer.ts`) montado pelo scroll em seis tempos: taça, gelo, gin, hibisco, tônica e guarnição. A ficha ao lado mostra a receita, os ml no copo e a temperatura.
- **Galeria e depoimentos** logo depois do hero: as fotos reais dos eventos são a prova do serviço, então vêm antes de qualquer explicação.
- **Serviços**: o que o bar vende além da carta (bar de gin, welcome drink, flair...). Os serviços ligados a um extra da calculadora mostram o valor. Edite `servicos` em `content.ts`.
- **Carta**: o mesmo shader com cada drink da carta. A taça muda de forma (balão ↔ coupe), de cor e de guarnição. Para mudar a carta, edite `carta` em `content.ts`; o `look` de cada drink define taça, cor, gelo, espuma, rodela, raminho e frutinhas.
- **Drink assinatura** (`Criador.tsx`): o convidado escolhe base, sabor, estilo e guarnição, dá um nome ("Ana & Pedro") e vê o drink em 3D na hora. Pode pedir pelo WhatsApp ou salvar um cartão 1080×1350 para compartilhar (no celular abre o compartilhar do sistema). O drink criado entra no pedido da calculadora. Opções em `criador`, no `content.ts`.
- **Eventos**, **Monte seu bar** (calculadora: bartenders, drinks, gelo, investimento, nome, local e data → WhatsApp), **FAQ**, **Contato**.

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

### Fotos, logo e cor do prospect

Crie a pasta `prospects/<slug>/` (o `npm run prospect` já cria) e coloque até 6 fotos dos eventos dele (`.jpg`, `.png`, `.webp`, na ordem do nome do arquivo) e, se tiver, `logo.png` ou `logo.svg`. A cor da marca vai com `--cor "#1f6feb"`. No build:

- as fotos dele substituem as da galeria (legenda: nome e Instagram) e a primeira vira o fundo da imagem de prévia do WhatsApp;
- a logo entra no preloader, no topo e na imagem de prévia, num disco claro (funciona com logo escura ou colorida);
- a cor troca o rosa dos destaques; o site clareia ou escurece o tom sozinho para continuar legível no fundo escuro e no claro.

A pasta `prospects/` fica fora do git: é material de terceiros, use só para a prévia. Para testar só a cor, sem build: `?cor=1f6feb`.

Cada prospect fica em `prospects.json` e o build gera `dist/<slug>.html` e `dist/og/<slug>.jpg` (o cartão com o nome do bar e a foto do drink). Publique a pasta `dist/` inteira. O WhatsApp só mostra a imagem quando `site` está preenchido, porque a imagem precisa de endereço absoluto. O comando também sugere a mensagem para mandar.

### Aviso quando o prospect abre o link

```bash
npm run prospect -- --notify https://ntfy.sh/um-nome-dificil-de-adivinhar --build
```

Instale o app **ntfy** no celular e assine o mesmo tópico. Você recebe: quando o prospect abre a prévia (celular ou computador), quando chega no drink assinatura e na calculadora, quando clica no WhatsApp, quando gera o cartão do drink e quanto tempo ficou. Funciona com qualquer endereço https que aceite POST com texto (Google Apps Script, webhook próprio). Só eventos: nada sobre quem visita. Tópicos do ntfy.sh são públicos para quem souber o nome, então use um nome difícil de adivinhar.

Para não se notificar ao testar, abra a prévia uma vez com `?eu=1` no seu aparelho (`?eu=0` desfaz). O modo apresentação nunca notifica.

### Modo apresentação

Acrescente `?pitch=1` ao link (ex.: `drinks-da-ana.html?pitch=1`) para mostrar o site numa reunião: cada seção ganha uma nota “por que isso vende”. As notas ficam em `pitch`, no `content.ts`, e há um botão para ocultá-las.

Os dados aceitos (nome, cidade, Instagram, WhatsApp) passam por limpeza em `src/prospect.ts` e vão para a tela só como texto.

## Para adaptar a um cliente

1. `content.ts`: `brand` (nome, Instagram, WhatsApp), carta, opções do drink assinatura, pacotes e valores (`monte`), FAQ. Tudo que é ilustrativo está marcado com `DEMO`.
2. Fotos: coloque em `fotos/`, rode `npm run images` e preencha `src` em `galeria.photos`.
3. Depoimentos: troque pelos reais e remova o aviso "Depoimentos ilustrativos" em `Galeria.tsx`.

## Laboratório

`/lab.html?p=0.5` mostra a montagem num ponto fixo (slider embaixo). `/lab.html?d=clover` mostra um drink da carta pelo `slug`.

`/lab.html?poster=desktop` e `/lab.html?poster=mobile` (no `npm run dev`) regeram `public/media/poster-*.webp`, a foto do primeiro quadro do 3D que aparece enquanto o shader compila. Rode de novo se mudar o drink do hero; para a versão celular, abra a página num iframe ou janela de 390 px.
