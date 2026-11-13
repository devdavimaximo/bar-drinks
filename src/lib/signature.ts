import { useSyncExternalStore } from 'react';

/**
 * O drink que o convidado criou no Criador. A calculadora (Monte) lê daqui para
 * levar o drink junto no pedido do WhatsApp. Fica nulo até a pessoa mexer em algo.
 */
export type Signature = { name: string; recipe: string };

let current: Signature | null = null;
const subs = new Set<() => void>();

export function setSignature(s: Signature | null) {
  current = s;
  subs.forEach((f) => f());
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};

export const useSignature = () => useSyncExternalStore(subscribe, () => current);
