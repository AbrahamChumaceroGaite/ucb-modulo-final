/**
 * Formato de presentación. Ninguna pantalla construye su propio formateador.
 *
 * En el proyecto Angular auditado, tres pantallas formateaban fechas a mano y
 * dos de ellas usaban `toISOString()`, que pasa por UTC y en husos negativos
 * muestra el día anterior. Aquí se hace una vez.
 */

const LOCALE = 'es-BO';

/**
 * Dinero. El backend manda `BigDecimal` serializado como número JSON.
 *
 * Esto **solo formatea**. No se hacen sumas de dinero en el frontend: los
 * totales los calcula el backend, que es quien tiene la precisión decimal.
 */
export function formatearMoneda(valor: number, moneda = 'BOB'): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(valor);
}

/** Cantidad con su unidad: «2.5 kg». Sin decimales si es entero. */
export function formatearCantidad(valor: number, unidad?: string | null): string {
  const numero = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
  return unidad ? `${numero} ${unidad}` : numero;
}

/**
 * Una proporción (0–1) como porcentaje entero: `0.743` → «74%».
 *
 * Sin decimales a propósito: «74,36 %» sugiere una precisión que una
 * probabilidad estimada no tiene.
 */
export function formatearPorcentaje(proporcion: number): string {
  return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(proporcion);
}

/*
  Aquí vivían `formatearFechaHora`, `formatearRelativo`, `aIsoLocal` y
  `deIsoLocal`, y se borraron porque ninguna pantalla las llamaba. El
  comentario decía que volverían «el día que exista un campo de fecha que las
  necesite». Ese día llegó con ventas: `VentaResponse.fechaVenta` es el primer
  y único campo de fecha que el backend expone.

  Vuelve **una sola**, la que hace falta. Las otras tres siguen sin consumidor
  y siguen sin escribirse.
*/

/**
 * Fecha y hora de un `LocalDateTime` de Java: «21 sep 2026, 10:15».
 *
 * ## Por qué no pasa por `new Date()`
 *
 * `"2026-09-21T22:40:00"` no lleva zona. `new Date()` lo interpretaría en la
 * del navegador y, al formatear, podría moverlo de día — es el mismo fallo
 * que la regla §2.9 describe con `toISOString()`, en la otra dirección.
 *
 * Un `LocalDateTime` significa «la hora del reloj de la pared», así que se
 * lee tal cual, troceando el texto. Si llega algo que no tiene esa forma, se
 * devuelve el guion en vez de adivinar.
 */
export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) return '—';

  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(valor);
  if (!partes) return '—';

  const [, anio, mes, dia, hora, minuto] = partes;
  // Mediodía UTC: cualquier desfase de zona deja el día intacto, y aquí solo
  // se usa para que `Intl` escriba el nombre del mes.
  const soloParaElMes = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia), 12));

  const fecha = new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(soloParaElMes);

  return `${fecha}, ${hora}:${minuto}`;
}

/** Fecha corta: «14 ago 2026». */
export function formatearFecha(valor: string | Date | null | undefined): string {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha);
}

/** Iniciales para un avatar. Dos letras como mucho. */
/**
 * Un intervalo de fechas `AAAA-MM-DD` para un chip de filtro aplicado:
 * «1 oct 2026 — 9 oct 2026», «Desde …» o «Hasta …».
 *
 * Estuvo escrito dentro de la vista de ventas; salió aquí cuando la de
 * vencimientos necesitó el mismo chip, para que los dos digan lo mismo.
 */
export function formatearIntervalo(desde: string, hasta: string): string {
  if (desde && hasta) return `${formatearFecha(desde)} — ${formatearFecha(hasta)}`;
  return desde ? `Desde ${formatearFecha(desde)}` : `Hasta ${formatearFecha(hasta)}`;
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return (partes[0] ?? '').slice(0, 2).toUpperCase();
  return `${(partes[0] ?? '')[0] ?? ''}${(partes[1] ?? '')[0] ?? ''}`.toUpperCase();
}

/**
 * A `Date`, **sin mover el día**.
 *
 * `new Date('2026-09-21')` se interpreta en UTC: en La Paz (UTC−4) devuelve el
 * 20 de septiembre. Es la regla §2.9, y no es teórica — se reprodujo en el
 * navegador: el chip de «Filtrando por» de ventas decía «20 sept» para un
 * `?desde=2026-09-21`.
 *
 * El arreglo va aquí y no en la pantalla a propósito. Corregir solo la llamada
 * habría dejado la trampa armada para el siguiente que formatee una fecha sin
 * hora, y el siguiente era cualquiera: `formatearFecha` acepta `string`.
 *
 * Una fecha **con hora** sí se parsea como siempre: `new Date` la trata como
 * local salvo que traiga `Z` o un desfase explícito, que es lo correcto.
 */
function aFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (typeof valor !== 'string') return Number.isNaN(valor.getTime()) ? null : valor;

  const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloDia) {
    const [, anio, mes, dia] = soloDia;
    return new Date(Number(anio), Number(mes) - 1, Number(dia));
  }

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
