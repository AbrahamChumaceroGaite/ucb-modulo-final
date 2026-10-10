import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  LIMITE_POR_DEFECTO,
  paginaDe,
  paginadoSchema,
  totalPaginasDe,
  type Paginado,
} from './paginated';

/**
 * La API pagina con `skip`/`limit`; el número de página se **deriva**. Estas
 * pruebas existen porque guardar la página aparte es lo que desincroniza el
 * paginador de los datos, y porque un `limit` de cero rompía la división.
 */
describe('paginaDe', () => {
  it('la primera página es la 1, no la 0', () => {
    expect(paginaDe(0, 10)).toBe(1);
  });

  it('deriva la página del salto', () => {
    expect(paginaDe(20, 10)).toBe(3);
    expect(paginaDe(25, 10)).toBe(3);
  });

  it('un límite de cero no divide por cero', () => {
    expect(paginaDe(20, 0)).toBe(1);
  });
});

describe('totalPaginasDe', () => {
  it('redondea hacia arriba: una fila suelta también ocupa página', () => {
    expect(totalPaginasDe(21, 10)).toBe(3);
  });

  it('sin resultados sigue habiendo una página, la vacía', () => {
    expect(totalPaginasDe(0, LIMITE_POR_DEFECTO)).toBe(1);
  });
});

/**
 * `Paginado<T>` está escrito a mano y `paginadoSchema` lo valida en tiempo de
 * ejecución. Son dos declaraciones de la misma forma, y esta comprobación es
 * lo que impide que se separen: si alguien añade un campo a una sola, esto no
 * compila.
 */
describe('Paginado y su esquema no se pueden separar', () => {
  it('lo que valida el esquema es exactamente lo que declara el tipo', () => {
    type DelEsquema = z.infer<ReturnType<typeof paginadoSchema<z.ZodString>>>;

    expectTypeOf<DelEsquema>().toEqualTypeOf<Paginado<string>>();
  });
});
