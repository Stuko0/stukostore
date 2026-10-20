// Revelados de entrada. Una sola curva para todo el sitio.
//
// Dos detalles que costaron depuración:
// 1. Un elemento con `clip-path: inset(0 100% 0 0)` NO se intersecta consigo
//    mismo (Chrome aplica el clip), así que los `.reveal-media` se observan a
//    través de su contenedor.
// 2. Las islas Solid hidratan después de este módulo y pueden reemplazar nodos
//    ya observados. Por eso el registro se repite tras `load` y tras cada
//    navegación de Astro, y es idempotente.
//
// El estado oculto vive bajo `html.js-reveal`: si el JavaScript no corre, todo
// el contenido queda visible.

const BOUND = 'revealBound';

function observeText(root: ParentNode, observer: IntersectionObserver): void {
  root.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
    if (el.dataset[BOUND]) return;
    el.dataset[BOUND] = '1';
    observer.observe(el);
  });
}

function observeMedia(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.reveal-media').forEach((media) => {
    if (media.dataset[BOUND]) return;
    media.dataset[BOUND] = '1';
    const host = media.parentElement ?? media;
    if (host.classList.contains('reveal')) {
      // El observer de textos ya marca el contenedor; el CSS baja la marca.
      return;
    }
    const own = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          media.classList.add('is-inview');
          obs.disconnect();
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    );
    own.observe(host);
  });
}

export function initReveal(): void {
  if (typeof window === 'undefined') return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supports = 'IntersectionObserver' in window;

  const revealAll = () => {
    document.querySelectorAll('.reveal, .reveal-media').forEach((el) => el.classList.add('is-inview'));
  };

  if (reduce || !supports) {
    revealAll();
    return;
  }

  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );

  const run = () => {
    observeText(document, observer);
    observeMedia(document);
    // Red de seguridad: lo que ya está en pantalla se muestra aunque el
    // observer no haya disparado (navegadores viejos, capturas, impresión).
    window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-inview)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
          el.classList.add('is-inview');
        }
      });
    }, 900);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(run, 120);
  } else {
    window.addEventListener('load', () => window.setTimeout(run, 120), { once: true });
  }

  document.addEventListener('astro:page-load', () => window.setTimeout(run, 120));
  // Última pasada: las islas hidratan de forma asíncrona al `load`.
  window.setTimeout(run, 1400);
}
