import { beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * Lo que jsdom no trae y los componentes dan por hecho.
 *
 * No son parches decorativos: sin `matchMedia` no monta nada que consulte el
 * tema, y sin las funciones de puntero el tirador de la hoja lanza una
 * excepción en cuanto se toca.
 */
if (!window.matchMedia) {
  window.matchMedia = (consulta: string) =>
    ({
      matches: false,
      media: consulta,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}

/**
 * `ResizeObserver` no existe en jsdom, y los chips lo usan para saber si su
 * fila se desbordó y hay que enseñar las flechas.
 *
 * Es un doble que **no observa nada**: nunca llama al callback, porque en
 * jsdom no hay diseño que cambiar. Eso es exactamente lo que se quiere aquí —
 * que el componente monte sin explotar— y es también el motivo por el que
 * ninguna prueba afirma nada sobre las flechas: afirmarlo sería medir este
 * doble. Las flechas se comprueban en el navegador.
 */
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * Cada prueba arranca sin preferencias guardadas.
 *
 * `localStorage` es estado **global y persistente** dentro de un mismo archivo
 * de pruebas: jsdom no lo reinicia entre `it`. En cuanto la preferencia de
 * vista empezó a guardarse, una prueba que pulsaba «tabla» dejaba «tabla»
 * puesta para la siguiente — que montaba ya en tabla, volvía a pulsar el mismo
 * botón, no disparaba ningún cambio y fallaba con un mensaje que no apuntaba
 * a la causa.
 *
 * Va aquí y no en cada archivo porque es una política de aislamiento, no una
 * particularidad de una prueba.
 */
beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    // Si el navegador de pruebas no lo permite, no hay nada que limpiar.
  }
});
