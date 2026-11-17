/* ==========================================================================
   Todo o texto e todos os dados do site. Versão demonstrativa, sem marca:
   nomes, valores, depoimentos e fotos são ilustrativos (marcados com DEMO) e
   devem ser trocados pelos do cliente. O site inteiro lê daqui, inclusive o 3D.
   Numa prévia personalizada (src/prospect.ts), o nome, o Instagram, o WhatsApp
   e a cidade vêm do link do prospect.
   ========================================================================== */

import { personalized, prospect } from './prospect';

export const brand = {
  /** DEMO: nome genérico de propósito; troque pelo nome do cliente */
  name: prospect.bar || 'Renan Open Drink',
  descriptor: 'Open bar & barman',
  region: prospect.cidade ? `Open bar · ${prospect.cidade}` : 'Open bar · Rio de Janeiro',
  instagram: `@${prospect.ig || 'renanopendrink'}`,
  instagramUrl: `https://www.instagram.com/${prospect.ig || 'renanopendrink'}`,
  whatsapp: prospect.wa || '5521997545672',
  whatsappDisplay: '(21) 99754-5672',
};

/** o selo fixo no rodapé da tela: deixa claro que é uma proposta, não o site oficial */
export const demoTag = personalized ? `Prévia do site · ${brand.name}` : `Prévia do site · ${brand.name}`;

export const nav = [
  { id: 'galeria', label: 'Galeria' },
  { id: 'o-bar', label: 'O bar' },
  { id: 'carta', label: 'Carta' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'criador', label: 'Crie seu drink' },
  { id: 'monte', label: 'Monte seu bar' },
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
    id: 'caipirinhas',
    title: 'Caipirinhas',
    subtitle: 'A especialidade do Renan, com fruta fresca',
    drinks: [
      {
        slug: 'caipirinha',
        name: 'Caipirinha de Limão',
        base: 'Cachaça',
        notes: 'Limão-taiti espremido na hora com açúcar, cachaça e muito gelo. A clássica, do jeito do Renan.',
        signature: true,
        look: { glass: 'copa', color: '#eef2cf', bottom: '#b9cf62', fill: 0.74, cloud: 0.4, ice: true, wheel: LIME, berries: { color: '#5d8a24', size: 0.034 } },
      },
      {
        slug: 'caipi-morango',
        name: 'Caipirinha de Morango',
        base: 'Cachaça ou vodka',
        notes: 'Morango macerado com açúcar e limão. A mais pedida da estação.',
        look: { glass: 'copa', color: '#ee6a7c', bottom: '#a8142e', fill: 0.74, cloud: 0.35, ice: true, berries: { color: '#c21d35', size: 0.044 } },
      },
      {
        slug: 'caipi-abacaxi',
        name: 'Caipirinha de Abacaxi',
        base: 'Cachaça ou vodka',
        notes: 'Abacaxi maduro em pedaços, amassado com açúcar. Doce e refrescante.',
        look: { glass: 'copa', color: '#f6dc78', bottom: '#e0b22a', fill: 0.74, cloud: 0.45, ice: true, berries: { color: '#f2c94c', size: 0.04 } },
      },
      {
        slug: 'caipi-maracuja',
        name: 'Caipirinha de Maracujá',
        base: 'Cachaça ou vodka',
        notes: 'Polpa de maracujá com as sementes, açúcar e gelo de sobra.',
        look: { glass: 'copa', color: '#f4d35a', bottom: '#d9a61c', fill: 0.74, cloud: 0.45, ice: true, berries: { color: '#1e140b', size: 0.016 } },
      },
    ],
  },
  {
    id: 'autorais',
    title: 'Outros da estação',
    subtitle: 'Fruta fresca, direto do bowl para o copo',
    drinks: [
      {
        slug: 'hibisco',
        name: 'Morango & Soda',
        base: 'Vodka',
        notes: 'Morango macerado, vodka, soda, hortelã e limão. O mais pedido do balcão.',
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
        name: 'Caipivodka de Kiwi',
        base: 'Vodka',
        notes: 'Kiwi fresco amassado na hora, limão e gelo de sobra.',
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
        name: 'Maracujá com Vodka',
        base: 'Vodka',
        notes: 'Maracujá batido com vodka e gelo.',
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
        name: 'Uva & Amora',
        base: 'Vodka',
        notes: 'Uva e amora maceradas, limão e um toque de açúcar.',
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
    title: 'Clássicos do balcão',
    subtitle: 'Os que nunca saem da festa',
    drinks: [
      {
        slug: 'clover',
        name: 'Batida de Morango',
        base: 'Vodka',
        notes: 'Morango, leite condensado e vodka, batida e servida na taça.',
        look: { glass: 'coupe', color: '#e8587d', fill: 0.86, cloud: 0.55, foam: 0.045, berries: { color: '#b0203a', size: 0.045 } },
      },
      {
        slug: 'daiquiri',
        name: 'Caipivodka de Limão',
        base: 'Vodka',
        notes: 'Limão-taiti, açúcar e vodka. Simples e certeira.',
        look: { glass: 'coupe', color: '#eef2cf', fill: 0.86, cloud: 0.6, wheel: { ...LIME, float: true } },
      },
      {
        slug: 'caipi-classica',
        name: 'Caipirinha na taça',
        base: 'Cachaça',
        notes: 'A original: limão-taiti, açúcar e cachaça.',
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
        name: 'Soda de Morango',
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
  kicker: 'Open bar & barman · RJ',
  lede: 'Caipirinha feita na hora, com limão, morango, abacaxi e maracujá frescos à mostra no balcão. Open bar com barman para aniversários, churrascos, festas juninas e casamentos no Rio.',
  hint: 'Role e veja a caipirinha nascer',
  /** o drink do hero é 3D: avisar e levar até as fotos de verdade */
  note: 'Animação ilustrativa',
  noteCta: 'ver fotos',
  /** última frase do hero; a galeria vem logo em seguida */
  outro: ['Agora veja', 'como fica na festa.'],
};

/** os seis tempos da montagem: `at` é onde cada um começa no scroll (0..1, ver gl/build.ts); `ml` e `temp` alimentam a ficha */
export const build = {
  steps: [
    { at: 0, name: 'O copo', line: 'Tudo começa no copo certo.', text: 'Taça gelada, pronta antes de o convidado chegar no balcão.', item: 'Taça gelada', ml: 0, temp: 6 },
    { at: 0.07, name: 'O gelo', line: 'Muito gelo, sempre.', text: 'Gelo de sobra do começo ao fim da festa. Caipirinha quente não sai do balcão.', item: 'Gelo em cubos', ml: 0, temp: 2 },
    { at: 0.22, name: 'A cachaça', line: 'Na medida.', text: 'Cachaça dosada, nada no olho. Quem prefere, troca por vodka.', item: '50 ml de cachaça', ml: 50, temp: 4 },
    { at: 0.38, name: 'O limão', line: 'Espremido na hora, com açúcar.', text: 'Limão-taiti cortado na frente do convidado, amassado com açúcar. Desce e assenta no fundo.', item: '1 limão-taiti e 2 colheres de açúcar', ml: 80, temp: 4 },
    { at: 0.54, name: 'A mexida', line: 'Completa e mexe.', text: 'Mais um pouco de cachaça e a colher sobe o limão pelo copo inteiro. Fica turva, do jeito certo.', item: 'Completa com cachaça e mexe', ml: 160, temp: 3 },
    { at: 0.74, name: 'O toque', line: 'Do jeito do Renan.', text: 'Pedaços de limão por cima e a rodela na borda. Pronta para a foto.', item: 'Rodela e pedaços de limão', ml: 160, temp: 3 },
  ],

  tag: 'A especialidade',
  priceNote: 'Também de morango, abacaxi e maracujá',
};

export const manifesto = {
  label: 'O bar',
  title: ['O bar é onde', 'a festa', 'acontece.'],
  body: 'É no balcão que a galera se encontra, brinda e volta a noite inteira. O Renan monta a estação com as frutas à mostra, o balcão iluminado e a equipe pronta para servir caipirinha, caipivodka e drink colorido até a última música.',
  pillars: [
    { k: 'Estação de drinks', v: 'frutas frescas à mostra no balcão' },
    { k: 'Barman & equipe', v: 'atendimento do começo ao fim' },
    { k: 'Estrutura completa', v: 'balcão iluminado, gelo e copos' },
  ],
  facts: [
    { n: 21, suffix: '', l: 'DDD: atendemos o Rio e região' },
    { n: drinkCount, suffix: '', l: 'drinks na carta de exemplo' },
    { n: 1, suffix: '', l: 'mensagem no WhatsApp para orçar' },
  ],
};

/* ---------- serviços: o que o bar vende além da carta ----------
   DEMO: troque pelos serviços do cliente. `extra` liga o serviço ao extra de mesmo
   id na calculadora (monte.extras), para o card mostrar o valor. */

export const servicos = {
  label: 'Serviços',
  title: ['Tudo o que o bar', 'leva para a festa.'],
  body: 'A carta é só o começo. Monte o bar do seu evento com os serviços que fazem os convidados lembrarem da noite.',
  items: [
    { k: 'Open bar', v: 'Drinks à vontade durante a festa, com barman no balcão.' },
    { k: 'Estação de drinks', v: 'Frutas frescas expostas em bowls: o convidado escolhe e o drink sai na hora.' },
    { k: 'Caipirinhas & caipivodkas', v: 'Limão, morango, maracujá, kiwi, abacaxi e o que a festa pedir.' },
    { k: 'Drink com o nome', v: 'Um drink com o nome do aniversariante, do casal ou da empresa.', extra: 'assinatura' },
    { k: 'Sem álcool', v: 'Drinks coloridos sem álcool para a criançada e quem está dirigindo.', extra: 'semalcool' },
    { k: 'Churrasco & festa junina', v: 'Bar para o churrasco de domingo e para o arraiá, com drink quente na fogueira.' },
    { k: 'Equipe', v: 'Barman e ajudantes para festa grande, sem fila no bar.' },
    { k: 'Estrutura completa', v: 'Balcão com LED, gelo, copos, frutas e insumos. Você só recebe os convidados.' },
  ],
};

/* ---------- modo apresentação (?pitch=1) ----------
   Notas de venda sobre cada seção, para mostrar o site numa reunião com o dono
   do bar. Chave = id da seção. Não aparecem para mais ninguém. */

export const pitch: Record<string, [string, string]> = {
  topo: ['Primeira impressão', 'Em três segundos o cliente vê um drink sendo montado em 3D, com o nome do bar. Nada de site genérico de modelo pronto.'],
  'o-bar': ['Confiança', 'Diferenciais e números logo no início: por que contratar este bar e não o concorrente que só tem Instagram.'],
  servicos: ['Ticket maior', 'Cada serviço é um motivo a mais para fechar e um extra que entra no orçamento.'],
  carta: ['A carta vira vitrine', 'Cada drink aparece como chega ao convidado. “Quero na minha festa” já abre o WhatsApp com o pedido.'],
  eventos: ['Fala com cada público', 'Casamento, 15 anos, corporativo: o cliente se enxerga no tipo de festa dele.'],
  criador: ['Marketing que se espalha', 'Os noivos criam o drink com o nome deles e compartilham a imagem, com o nome do bar no rodapé.'],
  monte: ['Orçamento qualificado', 'O pedido chega pronto no WhatsApp: data, local, convidados, pacote e valor estimado. Menos conversa, mais contrato.'],
  galeria: ['Prova real logo de cara', 'Logo depois da animação vêm as fotos dos eventos e os depoimentos: o cliente vê que o bar existe e entrega.'],
  perguntas: ['Menos tempo no atendimento', 'As dúvidas de sempre respondidas antes de chegar no WhatsApp.'],
  contato: ['Tudo termina numa conversa', 'Cada botão do site leva para o WhatsApp do bar, com a mensagem já escrita.'],
};

export const cartaCopy = {
  label: 'Carta',
  title: ['Escolha', 'pela cor.'],
  body: 'Carta de exemplo: cada drink aparece como chega ao convidado. Toque em um nome para servir. A carta final é montada com você.',
  demo: 'Simulação 3D · toque para servir',
};

/* ---------- formatos de evento ---------- */

export const eventos = {
  label: 'Eventos',
  title: ['Um bar para', 'cada festa.'],
  items: [
    {
      id: 'aniversario',
      name: 'Aniversários',
      line: 'O bar que vira o ponto de encontro.',
      text: 'Estação de drinks com as frutas à mostra, balcão iluminado e drink colorido para a foto. Em casa, no salão ou no condomínio.',
      meta: ['festas pequenas e grandes', 'sob consulta'],
      tags: ['Estação de frutas', 'Balcão com LED', 'Sem álcool para as crianças'],
    },
    {
      id: 'churrasco',
      name: 'Churrascos',
      line: 'Carne na brasa, caipirinha no copo.',
      text: 'O churrasco de família ou da firma com barman de verdade: caipirinha, caipivodka e drinks gelados a tarde inteira.',
      meta: ['na sua casa ou no sítio', 'sob consulta'],
      tags: ['Caipirinhas', 'Muito gelo', 'Montagem rápida'],
    },
    {
      id: 'junina',
      name: 'Festas juninas',
      line: 'Arraiá com drink de respeito.',
      text: 'Quentão, drinks com amendoim e frutas da estação. O bar entra no clima da festa sem perder o capricho.',
      meta: ['junho e julho', 'sob consulta'],
      tags: ['Drinks juninos', 'Decoração no clima', 'Para toda a família'],
    },
    {
      id: 'casamento',
      name: 'Casamentos & 15 anos',
      line: 'Do primeiro brinde à última música.',
      text: 'Open bar completo com equipe, drink com o nome dos noivos ou da debutante e carta sem álcool para os menores.',
      meta: ['equipe conforme os convidados', '5 a 7 horas'],
      tags: ['Drink com o nome', 'Equipe completa', 'Carta sem álcool'],
    },
  ],
};

/* ---------- drink assinatura (criador) ----------
   O convidado monta o drink do evento: cada escolha vira um `Look` e o mesmo
   shader da carta mostra o resultado na hora. Ver componente Criador.tsx. */

export type Garnish = { id: string; name: string; group: 'wheel' | 'sprig' | 'berry' };

export const criador = {
  label: 'Drink assinatura',
  title: ['Crie o drink', 'do seu evento.'],
  body: 'Escolha a base, o sabor e a guarnição, e dê um nome. O drink aparece aqui do jeito que vai chegar aos convidados, e a receita segue junto com o pedido.',
  namePlaceholder: 'Niver da Ana',
  fallbackName: 'O drink de vocês',
  bases: ['Vodka', 'Cachaça', 'Gin', 'Rum', 'Sem álcool'],
  flavors: [
    { id: 'hibisco', name: 'Hibisco', color: '#f27e9d', bottom: '#9c1238', berry: '#c3304f' },
    { id: 'vermelhas', name: 'Frutas vermelhas', color: '#e8476a', bottom: '#86102c', berry: '#a3122f' },
    { id: 'maracuja', name: 'Maracujá', color: '#f4d35a', bottom: '#d9a61c', berry: '#1e140b', cloud: 0.4 },
    { id: 'amora', name: 'Amora & lavanda', color: '#a565c2', bottom: '#4b155f', berry: '#2a0d30' },
    { id: 'pepino', name: 'Pepino & manjericão', color: '#d9efb4', berry: '#3e6a2c' },
    { id: 'limao', name: 'Limão & hortelã', color: '#e4f2d0', berry: '#4f7d22', cloud: 0.2 },
  ],
  styles: [
    { id: 'long', name: 'Long drink', text: 'taça balão, gelo e água tônica' },
    { id: 'batido', name: 'Batido', text: 'na coupe, com espuma de seda' },
  ],
  garnishes: [
    { id: 'siciliano', name: 'Limão-siciliano', group: 'wheel' },
    { id: 'taiti', name: 'Limão-taiti', group: 'wheel' },
    { id: 'alecrim', name: 'Alecrim', group: 'sprig' },
    { id: 'hortela', name: 'Hortelã', group: 'sprig' },
    { id: 'frutinhas', name: 'Frutinhas', group: 'berry' },
  ] as Garnish[],
  /** o que o cartão compartilhável diz no rodapé */
  cardFooter: 'criado no site',
};

/* ---------- monte seu bar (calculadora) ----------
   DEMO: valores de referência por convidado; troque pela tabela do cliente.
   Base de 5 horas; cada hora a mais ou a menos muda o pacote em `hourStep`. */

export const monte = {
  label: 'Monte seu bar',
  title: ['Monte o bar', 'da sua festa.'],
  body: 'Escolha o formato, o número de convidados e o pacote. A conta sai na hora e chega pronta no nosso WhatsApp.',
  kinds: ['Aniversário', 'Churrasco', 'Festa junina', 'Casamento / 15 anos'],
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
  title: ['Festas que', 'o Renan serviu.'],
  note: 'Fotos do @renanopendrink',
  photos: [
    { src: 'frutas', caption: 'Estação de frutas', meta: 'melancia, abacaxi, morango e limão no balcão', tone: 'gold' },
    { src: 'renan', caption: 'O Renan no balcão', meta: 'coqueteleira na mão, LED ligado', tone: 'rose' },
    { src: 'equipe', caption: 'Equipe', meta: 'atendimento do começo ao fim', tone: 'gold' },
    { src: 'estacao', caption: 'Open bar', meta: 'caipirinha e caipivodka na hora', tone: 'rose' },
    { src: 'led-azul', caption: 'Balcão iluminado', meta: 'gin, vodka e frutas frescas', tone: 'violet' },
    { src: 'noite', caption: 'Festa à noite', meta: 'o bar acende junto com a pista', tone: 'gold' },
  ],
  /** DEMO: depoimentos ilustrativos; troque pelos do cliente */
  quotes: [
    { text: 'Espaço reservado para o depoimento de um cliente do Renan.', who: 'Cliente', where: 'Aniversário' },
    { text: 'Espaço reservado para o depoimento de um cliente do Renan.', who: 'Cliente', where: 'Churrasco' },
    { text: 'Espaço reservado para o depoimento de um cliente do Renan.', who: 'Cliente', where: 'Festa' },
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
    a: 'Atendemos o Rio de Janeiro e a região. A taxa de deslocamento é calculada a partir do endereço do evento.',
  },
];

export const contato = {
  label: 'Contato',
  title: ['Vamos servir', 'a sua festa?'],
  body: 'Conte a data, o local e o número de convidados. A gente responde com a carta e o orçamento.',
  message: `Olá, ${brand.name}! Gostaria de um orçamento de bar de drinks para o meu evento.`,
};
