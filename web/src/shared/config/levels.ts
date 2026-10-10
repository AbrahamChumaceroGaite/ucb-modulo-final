import type { Tone } from './variants';

/**
 * La escala de «cómo de mal está esto», compartida por todo el producto.
 *
 * ## Por qué está en `shared` y no en `productos`
 *
 * Porque estaba escrita **tres veces**: el tono en la tarjeta de insumos, el
 * texto en el dominio de productos, y una copia literal de ambos en los datos
 * del catálogo —con las mismas tres claves y los mismos tres colores—. Tres
 * copias de un vocabulario de tres palabras.
 *
 * Y porque no es de productos: Caja e Inventario van a medir umbrales igual, y
 * si cada uno trae su propia escala acabaremos con «crítico» en rojo aquí y en
 * naranja allí. El **umbral** sí es de cada dominio —cuándo un insumo está
 * crítico lo decide `nivelDeStock`—; la **escala** es de todos.
 *
 * El texto es genérico a propósito: dice el estado, no de qué. Una pantalla que
 * necesite «Hay que reponer» en lugar de «Crítico» lo escribe ella, que es
 * quien sabe de qué está hablando.
 */
export type Nivel = 'critico' | 'bajo' | 'suficiente';

export const TONO_POR_NIVEL: Record<Nivel, Tone> = {
  critico: 'danger',
  bajo: 'warning',
  suficiente: 'success',
};

/** Texto neutro del nivel. Cada dominio puede poner el suyo si dice más. */
export const TEXTO_POR_NIVEL: Record<Nivel, string> = {
  critico: 'Crítico',
  bajo: 'Bajo',
  suficiente: 'En orden',
};
