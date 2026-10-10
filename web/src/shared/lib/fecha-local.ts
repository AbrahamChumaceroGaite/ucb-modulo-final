/**
 * `AAAA-MM-DD` ↔ `Date`, siempre en hora **local** y nunca pasando por UTC.
 *
 * Vivían como dos funciones privadas de `date-filter.tsx`. Salieron a `shared`
 * cuando un segundo sitio —el formulario de evaluación de lotes— necesitó lo
 * mismo: copiarlas habría dejado dos versiones del único truco que importa
 * aquí, y la regla 16.3 existe por eso.
 *
 * El truco: `new Date('2026-09-21')` se interpreta en UTC y en La Paz enseña
 * el día 20; `toISOString()` hace el mismo viaje al revés. Por eso el `Date`
 * se arma con sus partes locales y se desarma con `getFullYear`/`getMonth`/
 * `getDate`. Es la regla §2.9 y el mismo fallo que evita `formatearFechaHora`.
 */
export function aFechaLocal(texto: string | null | undefined): Date | undefined {
  if (!texto) return undefined;

  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return undefined;

  const [, anio, mes, dia] = partes;
  return new Date(Number(anio), Number(mes) - 1, Number(dia));
}

/** `Date` → `AAAA-MM-DD` con sus partes locales. **Nunca `toISOString()`.** */
export function aTextoDeFecha(fecha: Date | null | undefined): string | null {
  if (!fecha) return null;

  const dos = (valor: number) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}
