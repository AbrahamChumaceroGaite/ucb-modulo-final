import { describe, expect, it } from 'vitest';
import { aFechaLocal, aTextoDeFecha } from './fecha-local';

describe('fecha local', () => {
  it('ida y vuelta sin perder un día, sea cual sea la zona', () => {
    for (const texto of ['2026-01-01', '2026-09-21', '2026-12-31', '2028-02-29']) {
      expect(aTextoDeFecha(aFechaLocal(texto))).toBe(texto);
    }
  });

  it('el día del Date es el del texto, en hora local', () => {
    const fecha = aFechaLocal('2026-09-21');
    expect([fecha?.getFullYear(), fecha?.getMonth(), fecha?.getDate()]).toEqual([2026, 8, 21]);
  });

  it('lo que no tiene la forma AAAA-MM-DD no es una fecha', () => {
    expect(aFechaLocal('21/09/2026')).toBeUndefined();
    expect(aFechaLocal('')).toBeUndefined();
    expect(aTextoDeFecha(null)).toBeNull();
  });
});
