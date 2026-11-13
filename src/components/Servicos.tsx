import { useRef } from 'react';
import { monte, servicos } from '../content';
import { brl } from '../lib/env';
import { useReveal } from '../lib/reveal';
import { scrollToId } from '../lib/scroller';

/** valor do extra na calculadora, quando o serviço tem um */
const priceOf = (id?: string) => {
  const e = monte.extras.find((x) => x.id === id);
  return e ? (e.per ? `+ ${brl(e.price)} por convidado` : `+ ${brl(e.price)}`) : null;
};

/**
 * O que o bar vende além da carta. Mostra amplitude (o site não é só uma lista de
 * drinks) e cada serviço com valor vira um extra no orçamento.
 */
export default function Servicos() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section className="servicos" id="servicos" ref={root}>
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__n">II</span> {servicos.label}
        </p>
        <p className="eyebrow">Para montar o seu bar</p>
      </div>

      <div className="servicos__head">
        <h2 className="display servicos__title" data-split>
          {servicos.title[0]} <em>{servicos.title[1]}</em>
        </h2>
        <p className="servicos__body" data-rise>
          {servicos.body}
        </p>
      </div>

      <ul className="svc">
        {servicos.items.map((s, i) => {
          const price = priceOf(s.extra);
          return (
            <li key={s.k} className="svc__item" data-rise={(i % 4) * 0.06}>
              <small>{String(i + 1).padStart(2, '0')}</small>
              <h3>{s.k}</h3>
              <p>{s.v}</p>
              {price && <span className="svc__price">{price}</span>}
            </li>
          );
        })}
      </ul>

      <button className="btn btn--solid btn--lg servicos__cta" onClick={() => scrollToId('monte', 2.2)} data-rise data-cursor="montar">
        Montar o bar do meu evento
      </button>
    </section>
  );
}
