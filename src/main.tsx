import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// opsz: o CSS fixa o tamanho óptico da Bodoni (ver .display em global.css)
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/manrope/wght.css';
import './styles/global.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
