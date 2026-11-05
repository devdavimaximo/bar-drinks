/* ==========================================================================
   Todo o texto e todos os dados do site. Versão demonstrativa, sem marca:
   nomes, valores, depoimentos e fotos são ilustrativos (marcados com DEMO) e
   devem ser trocados pelos do cliente. O site inteiro lê daqui, inclusive o 3D.
   ========================================================================== */

export const brand = {
  /** DEMO: nome genérico de propósito; troque pelo nome do cliente */
  name: 'Seu Bar',
  descriptor: 'Coquetelaria para eventos',
  region: 'Drinks autorais para eventos',
  instagram: '@seubar',
  instagramUrl: 'https://www.instagram.com/',
  /** DEMO: sem número; troque pelo WhatsApp do cliente (DDI + DDD + número) */
  whatsapp: '',
  whatsappDisplay: 'Fale pelo WhatsApp',
};

export const nav = [
  { id: 'o-bar', label: 'O bar' },
  { id: 'carta', label: 'Carta' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'monte', label: 'Monte seu bar' },
  { id: 'galeria', label: 'Galeria' },
  { id: 'perguntas', label: 'Perguntas' },
];

/* ---------- a aparência de um drink no 3D ----------
   `color` é a cor da luz que atravessa uns 8 cm de bebida; `bottom` escurece o
   fundo da taça (xarope que assentou). O shader converte as duas em absorção. */

export type Look = {
  glass: 'copa' | 'coupe';
  color: string;
  bottom?: string;
  /** 0..1 da altura útil da taça */
  fill: number;
  /** turvo: suco, clara, limão espremido */
  cloud?: number;
  /** espuma no topo (em unidades da cena; ~0,04 é um dedo) */
  foam?: number;
  bubbles?: number;
  ice?: boolean;
  /** rodela: na parede da taça ou boiando deitada */
  wheel?: { pulp: string; rind: string; float?: boolean };
  /** raminho: alecrim, hortelã, manjericão */
  sprig?: string;
  berries?: { color: string; size: number };
};

export type Drink = { slug: string; name: string; base: string; notes: string; look: Look; signature?: boolean };
export type DrinkGroup = { id: string; title: string; subtitle: string; drinks: Drink[] };

const LEMON = { pulp: '#f3e27a', rind: '#e2c22e' };
const LIME = { pulp: '#cfe08a', rind: '#4f7d22' };

/** DEMO: carta ilustrativa, com drinks comuns em bares de evento; troque pela do cliente */
export const carta: DrinkGroup[] = [
  {
    id: 'autorais',
    title: 'Autorais',
    subtitle: 'Criados aqui, servidos só aqui',
    drinks: [
      {
        slug: 'hibisco',
        name: 'Gin, Hibisco & Tônica',
        base: 'Gin London Dry',
        notes: 'Xarope de hibisco da casa, tônica, alecrim, limão-siciliano e pimenta-rosa.',
        signature: true,
        look: {
          glass: 'copa',
          color: '#f27e9d',
          bottom: '#9c1238',
          fill: 0.78,
          bubbles: 1,
          ice: true,
          wheel: LEMON,
          sprig: '#2f4a2a',
          berries: { color: '#c3304f', size: 0.022 },
        },
      },
      {
        slug: 'jardim',
        name: 'Jardim',
        base: 'Gin',
        notes: 'Pepino, limão, manjericão e tônica. Fresco do primeiro ao último gole.',
        look: {
          glass: 'copa',
          color: '#d9efb4',
          fill: 0.76,
          bubbles: 0.8,
          ice: true,
          wheel: { pulp: '#e4f0c4', rind: '#3d6a2b' },
          sprig: '#3e6a2c',
        },
      },
      {
        slug: 'maracuja',
        name: 'Maracujá & Alecrim',
        base: 'Vodka',
        notes: 'Maracujá fresco, mel de flor de laranjeira e alecrim tostado.',
        look: {
          glass: 'copa',
          color: '#f4d35a',
          bottom: '#d9a61c',
          fill: 0.72,
          cloud: 0.4,
          ice: true,
          sprig: '#2f4a2a',
          berries: { color: '#1e140b', size: 0.016 },
        },
      },
      {
        slug: 'amora',
        name: 'Amora & Lavanda',
        base: 'Gin',
        notes: 'Amoras maceradas, xarope de lavanda e limão-siciliano.',
        look: {
          glass: 'copa',
          color: '#a565c2',
          bottom: '#4b155f',
          fill: 0.74,
          ice: true,
          berries: { color: '#2a0d30', size: 0.042 },
          sprig: '#55607a',
        },
      },
    ],
  },
  {
    id: 'classicos',
    title: 'Clássicos',
    subtitle: 'Receitas que atravessaram o século',
    drinks: [
      {
        slug: 'clover',
        name: 'Clover Club',
        base: 'Gin',
        notes: 'Framboesa, limão e clara batida até virar espuma de seda.',
        look: { glass: 'coupe', color: '#e8587d', fill: 0.86, cloud: 0.55, foam: 0.045, berries: { color: '#b0203a', size: 0.045 } },
      },
      {
        slug: 'daiquiri',
        name: 'Daiquiri',
        base: 'Rum branco',
        notes: 'Rum, limão e açúcar. Três ingredientes, nenhum lugar para errar.',
        look: { glass: 'coupe', color: '#eef2cf', fill: 0.86, cloud: 0.6, wheel: { ...LIME, float: true } },
      },
      {
        slug: 'caipirinha',
        name: 'Caipirinha de copa',
        base: 'Cachaça envelhecida',
        notes: 'Limão-taiti, açúcar demerara e gelo em cubos grandes, servida na taça.',
        look: { glass: 'copa', color: '#e9f0c6', fill: 0.62, cloud: 0.35, ice: true, wheel: LIME },
      },
    ],
  },
  {
    id: 'sem-alcool',
    title: 'Sem álcool',
    subtitle: 'Mesmo capricho, para todo mundo',
    drinks: [
      {
        slug: 'soda',
        name: 'Soda de Frutas Vermelhas',
        base: 'Sem álcool',
        notes: 'Xarope de frutas vermelhas da casa, limão e água com gás.',
        look: { glass: 'copa', color: '#e8476a', bottom: '#86102c', fill: 0.78, bubbles: 1, ice: true, berries: { color: '#a3122f', size: 0.04 } },
      },
      {
        slug: 'pink-lemonade',
        name: 'Pink Lemonade',
        base: 'Sem álcool',
        notes: 'Limão-siciliano, morango e hortelã, batida e coada.',
        look: { glass: 'copa', color: '#f7b8c6', fill: 0.76, cloud: 0.4, ice: true, wheel: LEMON, sprig: '#3e7a34' },
      },
      {
        slug: 'nojito',
        name: 'Nojito',
        base: 'Sem álcool',
        notes: 'O mojito sem rum: hortelã, limão, açúcar e muito gás.',
        look: { glass: 'copa', color: '#e4f2d0', fill: 0.78, bubbles: 0.9, ice: true, wheel: LIME, sprig: '#3e7a34' },
      },
    ],
  },
];

export const drinkCount = carta.reduce((n, g) => n + g.drinks.length, 0);
export const signature = carta.flatMap((g) => g.drinks).find((d) => d.signature)!;

/* ---------- hero: o drink-assinatura montado pelo scroll (ver gl/build.ts) ---------- */

export const hero = {
  kicker: 'Coquetelaria para eventos',
  lede: 'Bar de drinks autorais para casamentos, 15 anos e eventos corporativos. Carta exclusiva, bartenders e estrutura completa.',
  hint: 'Role e veja o drink nascer',
  /** o drink do hero é 3D: avisar e levar até as fotos de verdade */
  note: 'Animação ilustrativa',
  noteCta: 'ver fotos',
};

/** os seis tempos da montagem: `at` é onde cada um começa no scroll (0..1, ver gl/build.ts); `ml` e `temp` alimentam a ficha */
export const build = {
  steps: [
    { at: 0, name: 'A taça', line: 'Tudo começa no copo certo.', text: 'Taça balão de cristal, gelada antes de receber qualquer coisa.', item: 'Taça balão gelada', ml: 0, temp: 6 },
    { at: 0.07, name: 'O gelo', line: 'Gelo cristalino, em cubos grandes.', text: 'Derrete devagar e não deixa o drink aguado no meio da festa.', item: '3 cubos de gelo cristalino', ml: 0, temp: 2 },
    { at: 0.22, name: 'O gin', line: 'A base.', text: 'Gin London Dry, medido no dosador. Nada no olho.', item: '50 ml de gin London Dry', ml: 50, temp: 4 },
    { at: 0.38, name: 'O hibisco', line: 'A cor vem da flor.', text: 'Xarope de hibisco feito pela casa a cada evento. Assenta no fundo, por enquanto.', item: '20 ml de xarope de hibisco', ml: 70, temp: 4 },
    { at: 0.54, name: 'A tônica', line: 'Pela colher bailarina.', text: 'A tônica escorre pela colher para guardar o gás, e o hibisco sobe em degradê.', item: '120 ml de tônica', ml: 190, temp: 3 },
    { at: 0.74, name: 'O toque', line: 'Perfume antes do primeiro gole.', text: 'Alecrim, rodela de limão-siciliano e pimenta-rosa.', item: 'Alecrim, limão e pimenta-rosa', ml: 190, temp: 3 },
  ],
  tag: 'Assinatura da casa',
  priceNote: 'Na carta autoral',
};

export const manifesto = {
  label: 'O bar',
  title: ['O bar é onde', 'a festa', 'acontece.'],
  body: 'É no balcão que os convidados se encontram, brindam e voltam a noite inteira. Por isso cada drink é pensado para o seu evento: carta própria, ingredientes frescos, gelo cristalino e bartenders que sabem receber.',
  pillars: [
    { k: 'Carta autoral', v: 'criada para cada evento' },
    { k: 'Bartenders', v: 'uniformizados e treinados' },
    { k: 'Estrutura completa', v: 'balcão, gelo, copos e insumos' },
  ],
  /** DEMO: números ilustrativos; troque pelos do cliente */
  facts: [
    { n: 1, suffix: '', l: 'bartender a cada 60 convidados' },
    { n: 450, suffix: '+', l: 'eventos atendidos' },
    { n: drinkCount, suffix: '', l: 'drinks na carta' },
  ],
};

export const cartaCopy = {
  label: 'Carta',
  title: ['Escolha', 'pela cor.'],
  body: 'Cada drink da carta aparece aqui como vai chegar ao convidado: a taça, a cor e a guarnição. Toque em um nome para servir.',
  demo: 'Simulação 3D · toque para servir',
};

/* ---------- formatos de evento ---------- */

export const eventos = {
  label: 'Eventos',
  title: ['Um bar para', 'cada celebração.'],
  items: [
    {
      id: 'casamento',
      name: 'Casamentos',
      line: 'Do welcome drink ao último brinde.',
      text: 'Carta desenhada com os noivos, drink assinatura com o nome do casal e bar de gin para a pista. A gente chega antes da cerimônia e sai depois da última música.',
      meta: ['80 a 500 convidados', '5 a 7 horas'],
      tags: ['Degustação para os noivos', 'Drink assinatura', 'Welcome drink'],
    },
    {
      id: 'quinze',
      name: '15 anos',
      line: 'A carta sem álcool que ninguém esquece.',
      text: 'Drinks sem álcool tão bonitos quanto os clássicos, com controle por pulseira para os adultos. Cor, brilho e foto para o feed.',
      meta: ['100 a 350 convidados', '5 horas'],
      tags: ['Carta sem álcool', 'Pulseira para maiores de 18', 'Drinks com glitter comestível'],
    },
    {
      id: 'corporativo',
      name: 'Corporativo',
      line: 'A marca da empresa, dentro do copo.',
      text: 'Lançamentos, confraternizações, feiras e convenções. Drinks nas cores da marca, cardápio com logotipo e nota fiscal.',
      meta: ['50 a 1.000 pessoas', 'sob medida'],
      tags: ['Drinks nas cores da marca', 'Nota fiscal', 'Montagem rápida'],
    },
    {
      id: 'celebracoes',
      name: 'Aniversários & celebrações',
      line: 'O bar de casamento, na sua casa.',
      text: 'Aniversários, bodas, formaturas e jantares. Bar compacto que cabe na varanda, com a mesma carta e o mesmo cuidado.',
      meta: ['a partir de 40 convidados', '4 a 5 horas'],
      tags: ['Bar compacto', 'Em casa ou no salão', 'Carta enxuta'],
    },
  ],
};

/* ---------- monte seu bar (calculadora) ----------
   DEMO: valores de referência por convidado; troque pela tabela do cliente.
   Base de 5 horas; cada hora a mais ou a menos muda o pacote em `hourStep`. */

export const monte = {
  label: 'Monte seu bar',
  title: ['Monte o bar', 'da sua festa.'],
  body: 'Escolha o formato, o número de convidados e o pacote. A conta sai na hora e chega pronta no nosso WhatsApp.',
  kinds: ['Casamento', '15 anos', 'Corporativo', 'Aniversário'],
  guests: { min: 40, max: 500, step: 10, initial: 150 },
  hours: [4, 5, 6, 7],
  baseHours: 5,
  hourStep: 0.12,
  /** convidados por bartender */
  perBartender: 60,
  packages: [
    { id: 'classico', name: 'Clássico', perGuest: 42, text: 'Caipirinhas, gin tônica e 4 clássicos da coquetelaria.', drinks: 6 },
    { id: 'autoral', name: 'Autoral', perGuest: 58, text: 'A carta autoral completa e o drink assinatura do evento.', drinks: 9, featured: true },
    { id: 'premium', name: 'Premium', perGuest: 79, text: 'Destilados premium, bar de gin com 5 tônicas e espumante.', drinks: 12 },
  ],
  extras: [
    { id: 'assinatura', name: 'Drink com o nome do casal', price: 650, per: false },
    { id: 'semalcool', name: 'Carta sem álcool completa', price: 8, per: true },
    { id: 'cristal', name: 'Taças de cristal', price: 6, per: true },
    { id: 'flair', name: 'Show de flair (30 min)', price: 1200, per: false },
  ],
  caveat: 'Valores de referência. O orçamento final depende da data, do local, da carta escolhida e do deslocamento.',
};

/* ---------- galeria e depoimentos ----------
   DEMO: fotos de banco gratuito (Unsplash, licença em fotos/CREDITOS.md), ilustrativas.
   Para o cliente: troque os arquivos em fotos/, rode `npm run images` e ajuste `src`
   (nome do arquivo sem extensão). Com `src` vazio a moldura mostra onde a foto entra. */

export const galeria = {
  label: 'Galeria',
  title: ['Noites que', 'a gente serviu.'],
  note: 'Fotos ilustrativas · substituir pelas do cliente',
  photos: [
    { src: 'casamento', caption: 'Casamento', meta: 'boas-vindas com drink rosé', tone: 'rose' },
    { src: 'welcome', caption: 'Welcome drink', meta: 'coupes na chegada dos convidados', tone: 'gold' },
    { src: 'assinatura', caption: 'Gin tônica de hibisco', meta: 'a assinatura da casa', tone: 'rose' },
    { src: 'torre', caption: 'Torre de taças', meta: 'o brinde dos noivos', tone: 'gold' },
    { src: 'bar-de-gin', caption: 'Bar de gin', meta: 'servido na taça balão', tone: 'green' },
    { src: 'celebracao', caption: 'Aniversários & 15 anos', meta: 'o brinde na pista', tone: 'violet' },
  ],
  /** DEMO: depoimentos ilustrativos; troque pelos do cliente */
  quotes: [
    { text: 'Os convidados até hoje falam do drink com o nosso nome. O bar foi o lugar mais cheio da festa.', who: 'Noivos', where: 'Casamento, 180 convidados' },
    { text: 'Pontualidade, equipe educada e uma carta sem álcool que fez sucesso com os adolescentes e com os pais.', who: 'Mãe da aniversariante', where: '15 anos, 250 convidados' },
    { text: 'Fizeram drinks nas cores da marca para o lançamento. Virou a foto mais postada do evento.', who: 'Coordenação de eventos', where: 'Lançamento corporativo' },
  ],
};

/* ---------- perguntas frequentes ---------- */

/** DEMO: respostas plausíveis para o nicho; confirme cada uma com o cliente */
export const faq = [
  {
    q: 'Com quanto tempo de antecedência devo reservar?',
    a: 'Para casamentos aos sábados, o ideal é reservar de 6 a 12 meses antes. Para outras datas e eventos menores, consulte a agenda pelo WhatsApp.',
  },
  {
    q: 'O que está incluso no serviço?',
    a: 'Bartenders uniformizados, balcão, utensílios, insumos frescos, gelo, copos e taças, montagem e desmontagem. As bebidas da carta já entram no pacote.',
  },
  {
    q: 'Quantos bartenders vão trabalhar no meu evento?',
    a: 'Trabalhamos com um bartender a cada 60 convidados, em média, para que ninguém espere na fila do bar. Em eventos com bar de gin ou welcome drink, a equipe aumenta.',
  },
  {
    q: 'Dá para provar os drinks antes?',
    a: 'Sim. Depois da reserva, os noivos e os anfitriões fazem uma degustação para fechar a carta e criar o drink assinatura.',
  },
  {
    q: 'E nas festas de 15 anos?',
    a: 'Montamos uma carta sem álcool completa e usamos pulseiras para identificar os maiores de 18. Bebida alcoólica não é servida a menores de idade.',
  },
  {
    q: 'Vocês atendem fora da cidade?',
    a: 'Atendemos a cidade e a região. A taxa de deslocamento é calculada a partir do endereço do evento.',
  },
];

export const contato = {
  label: 'Contato',
  title: ['Vamos servir', 'a sua festa?'],
  body: 'Conte a data, o local e o número de convidados. A gente responde com a carta e o orçamento.',
  message: `Olá, ${brand.name}! Gostaria de um orçamento de bar de drinks para o meu evento.`,
};
