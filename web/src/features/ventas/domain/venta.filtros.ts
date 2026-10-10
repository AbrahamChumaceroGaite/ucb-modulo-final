import type { Venta } from './venta.schema';

/**
 * Lo que la pantalla de ventas puede acotar hoy.
 *
 * Misma forma que en las otras tres: **todos los filtros son listas**, la lista
 * vacía es «todos», y lo que se elige viaja en la URL. Eso es lo que permite
 * que `<FilterChips>` y `chipsDeLista` sirvan para las cuatro sin una rama
 * especial.
 *
 * ## El intervalo de fechas, por fin
 *
 * `VentaResponse` **sí** trae `fechaVenta` —es el único DTO del proyecto que
 * expone una fecha—, así que aquí el filtro de fecha no está apagado: funciona.
 * Sigue aplicándose sobre la página cargada, porque `ObtenerVentasRequest`
 * solo acepta `skip`, `limit` y `search`.
 *
 * Es un intervalo y no una lista porque no es una elección entre opciones: son
 * dos extremos. Por eso rompe la simetría de los otros filtros, y por eso se
 * dice aquí en vez de forzarlo a ser una lista de dos elementos.
 */
export type FiltrosDeVenta = {
  /** `'activas'` y/o `'baja'`. */
  estado: readonly string[];
  /** Ids de `estado_venta`. */
  estados: readonly string[];
  /** `AAAA-MM-DD`, o cadena vacía. Ambos extremos incluidos. */
  desde: string;
  hasta: string;
};

const pasa = (elegidos: readonly string[], valor: string | null) =>
  elegidos.length === 0 || (valor !== null && elegidos.includes(valor));

/**
 * El día de una venta, en su propia hora local.
 *
 * `fechaVenta` es un `LocalDateTime` sin zona: `"2026-09-21T10:15:30"`. Cortar
 * los diez primeros caracteres da el día **tal como lo vivió la cafetería**.
 * Pasarlo por `new Date()` lo interpretaría en la zona del navegador y movería
 * las ventas de después de las nueve de la noche al día siguiente — o al
 * anterior, según el signo. Es un fallo clásico y silencioso, y aquí no puede
 * ocurrir porque nunca se construye un `Date`.
 */
const diaDe = (fechaVenta: string) => fechaVenta.slice(0, 10);

/**
 * Acota una página ya cargada.
 *
 * Mismo criterio y misma limitación que las otras tres pantallas: los filtros
 * no pueden viajar al servidor, así que se aplican sobre lo que llegó y el
 * contador sigue diciendo el total real, que es lo honesto.
 */
export function filtrarVentas(
  filas: readonly Venta[],
  { estado, estados, desde, hasta }: FiltrosDeVenta,
): Venta[] {
  return filas.filter((venta) => {
    if (!pasa(estado, venta.borrado ? 'baja' : 'activas')) return false;
    if (!pasa(estados, venta.estadoVenta?.id ?? null)) return false;

    const dia = diaDe(venta.fechaVenta);
    // Comparación de cadenas: `AAAA-MM-DD` ordena igual como texto que como
    // fecha, así que no hace falta convertir nada.
    if (desde && dia < desde) return false;
    if (hasta && dia > hasta) return false;

    return true;
  });
}

/**
 * Lo vendido en lo que se está mirando.
 *
 * Suma `venta.total`, que es el que calculó el servidor, y **no recalcula** las
 * líneas: si las dos cifras no coincidieran, la verdad es la del servidor y
 * taparla con una suma local escondería el problema.
 *
 * Las dadas de baja no suman: una venta anulada no es dinero que entró.
 */
export function totalDeLoMostrado(filas: readonly Venta[]): number {
  return filas.reduce((suma, venta) => (venta.borrado ? suma : suma + venta.total), 0);
}
