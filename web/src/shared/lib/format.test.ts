import { describe, expect, it } from 'vitest';
import { formatearFecha, formatearFechaHora, formatearIntervalo, formatearPorcentaje } from './format';

/**
 * El formateo de un `LocalDateTime` de Java, que es lo que manda
 * `VentaResponse.fechaVenta`: sin zona horaria.
 *
 * La prueba que importa es la de las 22:40. Si esta función construyera un
 * `Date` a partir del texto, el navegador le pondría su zona y una venta de
 * la noche podría aparecer con la fecha del día siguiente —o del anterior—.
 * Es el mismo fallo que la regla §2.9 describe con `toISOString()`, y el
 * motivo por el que aquí se trocea el texto en vez de parsearlo.
 */
describe('formatearFechaHora', () => {
  it('escribe día, mes, año y hora', () => {
    expect(formatearFechaHora('2026-09-21T10:15:30')).toContain('10:15');
    expect(formatearFechaHora('2026-09-21T10:15:30')).toContain('2026');
  });

  it('una venta de las 22:40 sigue siendo del día 21, no del 22', () => {
    const texto = formatearFechaHora('2026-09-21T22:40:00');

    expect(texto).toContain('21');
    expect(texto).toContain('22:40');
    expect(texto).not.toContain('22 ');
  });

  it('una venta de las 00:30 sigue siendo del día que dice, no del anterior', () => {
    expect(formatearFechaHora('2026-01-01T00:30:00')).toContain('1 ene 2026');
  });

  it('sin fecha devuelve un guion, no «Invalid Date»', () => {
    expect(formatearFechaHora(null)).toBe('—');
    expect(formatearFechaHora(undefined)).toBe('—');
    expect(formatearFechaHora('')).toBe('—');
  });

  it('con algo que no tiene esa forma devuelve un guion en vez de adivinar', () => {
    expect(formatearFechaHora('ayer por la tarde')).toBe('—');
  });
});

/**
 * El fallo que esta tabla impide, reproducido en el navegador antes de
 * arreglarlo: con `?desde=2026-09-21`, el chip de «Filtrando por» de ventas
 * decía **«20 sept 2026»**. `new Date('2026-09-21')` se interpreta en UTC, y
 * en La Paz (UTC−4) eso es el día anterior. Es la regla §2.9.
 *
 * Se arregló en `aFecha`, no en la pantalla: corregir solo la llamada dejaba
 * la trampa armada para el siguiente que formateara una fecha sin hora.
 */
describe('formatearFecha con una fecha sin hora', () => {
  it('no retrocede un día por interpretar la cadena en UTC', () => {
    // `not.toContain('20')` sería una aserción rota: «2026» contiene «20».
    // Se comprueba el día como palabra suelta.
    expect(formatearFecha('2026-09-21')).toMatch(/^21 /);
  });

  it('el primero de enero no se va al año anterior', () => {
    expect(formatearFecha('2026-01-01')).toBe('1 ene 2026');
  });

  it('una fecha con hora se sigue formateando', () => {
    expect(formatearFecha('2026-09-21T10:15:30')).toMatch(/^21 /);
  });

  it('un `Date` se sigue aceptando', () => {
    expect(formatearFecha(new Date(2026, 8, 21))).toMatch(/^21 /);
  });
});

describe('formatearPorcentaje', () => {
  it('redondea al entero: una probabilidad estimada no tiene centésimas de verdad', () => {
    expect(formatearPorcentaje(0.743)).toBe('74%');
    expect(formatearPorcentaje(0.286)).toBe('29%');
    expect(formatearPorcentaje(1)).toBe('100%');
  });
});

describe('formatearIntervalo', () => {
  it('con los dos extremos, con uno solo, y siempre en hora local', () => {
    expect(formatearIntervalo('2026-10-01', '2026-10-09')).toBe(
      `${formatearFecha('2026-10-01')} — ${formatearFecha('2026-10-09')}`,
    );
    expect(formatearIntervalo('2026-10-01', '')).toBe(`Desde ${formatearFecha('2026-10-01')}`);
    expect(formatearIntervalo('', '2026-10-09')).toBe(`Hasta ${formatearFecha('2026-10-09')}`);
  });
});
