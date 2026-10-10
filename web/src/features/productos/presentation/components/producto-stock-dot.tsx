import { StatusDot } from '@/shared/ui/primitives';
import { TONO_POR_NIVEL } from '@/shared/config/levels';
import { nivelDeStock, TEXTO_NIVEL, type Producto } from '../../domain/producto.schema';

/**
 * El estado de una fila de la despensa: o está de baja, o dice cuánto queda.
 *
 * Va en un punto y no en una etiqueta porque la tabla es densa y una etiqueta
 * entera le robaría ancho a los datos. Pinta **texto además del color**: quien
 * no distingue rojo de verde tiene que poder leerlo igual.
 *
 * ## Por qué la baja gana al nivel
 *
 * Un producto dado de baja con 80 kg en la estantería salía como «Bien
 * surtido», que es cierto y a la vez engañoso: ese producto ya no se repone ni
 * se vende. Cuando el filtro está en «Dados de baja», la tabla enseñaba una
 * columna de estados verdes sin una sola señal de que todo estaba de baja —la
 * tarjeta sí lo decía, con su insignia—. Son dos vistas de la misma colección:
 * tienen que contar lo mismo.
 *
 * El umbral del nivel no se decide aquí —eso es negocio y vive en
 * `domain/producto.schema.ts`—, solo se pinta.
 */
export function ProductoStockDot({ producto }: { producto: Producto }) {
  if (producto.borrado) return <StatusDot tono="neutral">Dado de baja</StatusDot>;

  const nivel = nivelDeStock(producto);
  return <StatusDot tono={TONO_POR_NIVEL[nivel]}>{TEXTO_NIVEL[nivel]}</StatusDot>;
}
