import { brand } from '../content';

/** todas as conversas e pedidos acontecem no WhatsApp de atendimento */
const number = brand.whatsapp.replace(/\D/g, '');

export const whatsappHref = (message?: string) =>
  message ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/${number}`;

type Toast = (text: string) => void;
let toast: Toast = () => {};
export const setToast = (fn: Toast) => void (toast = fn);
export const showToast = (text: string) => toast(text);

/** abre o WhatsApp de atendimento com o pedido já escrito */
export function sendOrder(message: string) {
  window.open(whatsappHref(message), '_blank', 'noopener');
}
