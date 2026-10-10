import { useSyncExternalStore } from 'react';
import { vi } from 'vitest';

/**
 * Una barra de direcciones de mentira, pero **viva**.
 *
 * ## Por qué hace falta
 *
 * Las dos pantallas de lista guardan en la URL lo que se mira: pestaña,
 * búsqueda, página, vista y cada filtro (regla 8.11). Probar ese flujo exige
 * un `next/navigation` que se comporte como el de verdad: que `replace`
 * cambie la consulta **y vuelva a renderizar**.
 *
 * La primera versión solo espiaba la llamada. La vista escribía `?vista=tabla`
 * y seguía pintando tarjetas para siempre, porque nada la repintaba: la prueba
 * de la tabla fallaba por un fallo del arnés, no del producto. Aquí `replace`
 * hace las dos cosas, así que la prueba recorre el ciclo entero —pulsar,
 * escribir en la URL, releerla, repintar— en lugar de comprobar que se llamó a
 * una función.
 *
 * ## Por qué vive en `shared` y no en cada prueba
 *
 * Porque lo usan Personal y Productos, y dos copias de un arnés se separan a
 * la primera corrección. Es la misma razón por la que `<FilterBar>` está una
 * sola vez: lo que se repite es la composición, no el código.
 *
 * No entra en el paquete de producción: no lo importa nada fuera de un
 * `*.test.tsx`.
 */
let consulta = '';
const oyentes = new Set<() => void>();

const navegar = (url: string) => {
  consulta = url.split('?')[1] ?? '';
  for (const avisar of oyentes) avisar();
};

export const routerFalso = {
  replace: vi.fn(navegar),
  push: vi.fn(navegar),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

/** El sustituto de `useSearchParams`: lee la consulta y se suscribe a ella. */
export function useSearchParamsFalso() {
  const actual = useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => oyentes.delete(avisar);
    },
    () => consulta,
    () => consulta,
  );
  return new URLSearchParams(actual);
}

/** Deja la dirección en blanco entre pruebas. Se llama desde `beforeEach`. */
export function reiniciarRuta(inicial = '') {
  consulta = inicial;
  routerFalso.replace.mockClear();
  routerFalso.push.mockClear();
}

/** La última dirección escrita, para afirmar sobre ella. */
export const rutaActual = () => consulta;
