import { filaCsv } from '@/shared/lib/descargar';
import { lineasVigentes, type Venta } from './venta.schema';

/**
 * El reporte de ventas, como texto.
 *
 * ## Por qué está en el dominio y no en la pantalla
 *
 * Porque decide **qué cuenta como una fila del reporte** y **qué columnas
 * tiene**, que son preguntas de negocio, no de interfaz. Y porque así se
 * prueba sin navegador: una función que recibe ventas y devuelve texto.
 *
 * La pantalla se queda con lo suyo: pedir las páginas, avisar y descargar.
 *
 * ## Una fila por venta, no por línea
 *
 * Lo que se cuadra al cerrar es el ticket, no el producto. Un reporte por
 * líneas es otro reporte —útil para saber qué se vende— y tendría otras
 * columnas y otro total; mezclarlos daría un archivo en el que la columna de
 * importes no suma el total.
 *
 * ## Las anuladas salen, marcadas
 *
 * Quitarlas escondería que existieron, y quien cuadra caja necesita ver por
 * qué la suma no coincide con el número de tickets. Por eso van con su
 * columna, y **no suman** en el total — igual que en la pantalla.
 *
 * ## Los números llevan coma
 *
 * `toLocaleString('es-BO')` y no `toFixed`: el archivo se abre con doble clic
 * en un Excel configurado en español, donde «3.60» se lee como texto o como
 * trescientos sesenta. Es la misma decisión que el separador `;` de
 * `descargar.ts`, y por el mismo motivo.
 */
const COLUMNAS = [
  'Fecha',
  'Hora',
  'Cliente',
  'Estado',
  'Líneas',
  'Total',
  'Anulada',
] as const;

const LOCALE = 'es-BO';

const importe = (valor: number) =>
  valor.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type ResolverNombre = (idCliente: string | null) => string | undefined;

/**
 * Convierte las ventas en un CSV.
 *
 * `fechaVenta` es un `LocalDateTime` sin zona, así que la fecha y la hora se
 * sacan **troceando el texto**: pasarlo por `new Date()` movería de día las
 * ventas de la noche, que es el fallo de la regla §2.9 y el que ya se coló una
 * vez en el chip de filtros.
 */
export function aCsv(ventas: readonly Venta[], nombreDelCliente: ResolverNombre): string {
  const filas = ventas.map((venta) =>
    filaCsv([
      venta.fechaVenta.slice(0, 10),
      venta.fechaVenta.slice(11, 16),
      nombreDelCliente(venta.idCliente) ?? 'Mostrador',
      venta.estadoVenta?.nombre ?? '',
      lineasVigentes(venta).length,
      importe(venta.total),
      venta.borrado ? 'Sí' : 'No',
    ]),
  );

  const total = ventas.reduce((suma, venta) => (venta.borrado ? suma : suma + venta.total), 0);

  return [
    filaCsv([...COLUMNAS]),
    ...filas,
    // Una fila de cierre con el total de lo que **no** está anulado: es la
    // cifra que se compara con la caja, y tenerla en el archivo evita que
    // alguien la calcule a mano y se equivoque.
    filaCsv(['', '', '', '', 'Total', importe(total), '']),
  ].join('\r\n');
}

/**
 * Cómo se llama el archivo.
 *
 * Lleva la fecha **y la hora** porque se descarga varias veces el mismo día y
 * un nombre repetido acaba en «reporte (3).csv», que no dice cuál es cuál.
 */
export function nombreDelReporte(ahora: Date): string {
  const dos = (valor: number) => String(valor).padStart(2, '0');
  const fecha = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
  const hora = `${dos(ahora.getHours())}${dos(ahora.getMinutes())}`;

  return `ventas-${fecha}-${hora}.csv`;
}
