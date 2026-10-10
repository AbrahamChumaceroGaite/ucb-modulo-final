import { z } from 'zod';

/**
 * Paginación tal como la hace Spring. Verificado en `PaginatedResponse.java`:
 * `{ data, skip, limit, total, hasMore }`.
 *
 * Es `skip`/`limit`, no `page`. El número de página se **deriva**; no se guarda
 * aparte, porque dos fuentes para el mismo dato se desincronizan.
 */
export function paginadoSchema<T extends z.ZodTypeAny>(elemento: T) {
  return z.object({
    data: z.array(elemento),
    skip: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  });
}

/**
 * La misma forma, como tipo genérico.
 *
 * Estuvo borrada un tiempo, con razón: nadie la importaba y duplicaba el
 * esquema. Vuelve porque ahora sí hay un consumidor que la necesita **sin un
 * esquema delante** —un puerto de datos con dos implementaciones, una de las
 * cuales no valida nada porque los datos los inventa ella—.
 *
 * Que no se desincronice del esquema no se deja a la buena voluntad: hay una
 * comprobación de tipos en `paginated.test.ts` que falla al compilar si uno de
 * los dos cambia sin el otro.
 */
export type Paginado<T> = {
  data: T[];
  skip: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/** Parámetros de listado que la API acepta. Enviar otro da 400. */
export type ParamsListado = {
  skip?: number;
  limit?: number;
  search?: string;
};

export const LIMITES_PAGINA = [10, 25, 50] as const;
export const LIMITE_POR_DEFECTO = 10;

/** Página actual (base 1) a partir de `skip` y `limit`. */
export function paginaDe(skip: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.floor(skip / limit) + 1;
}

export function totalPaginasDe(total: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}
