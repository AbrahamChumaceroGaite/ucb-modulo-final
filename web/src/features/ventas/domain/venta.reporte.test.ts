import { describe, expect, it } from 'vitest';
import { aCsv, nombreDelReporte } from './venta.reporte';
import type { Venta } from './venta.schema';

const venta = (
  id: string,
  fechaVenta: string,
  total: number,
  idCliente: string | null,
  borrado = false,
): Venta => ({
  id,
  fechaVenta,
  total,
  idUsuario: 'u-1',
  idCliente,
  estadoVenta: { id: 'ev', nombre: 'Pagada', borrado: false },
  detalles: [
    {
      id: 'd-1',
      idProducto: 'pr-1',
      precioUnitario: total,
      cantidad: 1,
      subtotal: total,
      descuentoAplicado: 0,
      estado: true,
      borrado: false,
    },
  ],
  borrado,
});

const nombres = (id: string | null) => (id === 'c-1' ? 'Luis Chavez' : undefined);

const filas = (csv: string) => csv.split('\r\n');

describe('aCsv', () => {
  it('abre con la fila de cabeceras', () => {
    const csv = aCsv([], nombres);
    expect(filas(csv)[0]).toBe('Fecha;Hora;Cliente;Estado;Líneas;Total;Anulada');
  });

  /**
   * `fechaVenta` es un `LocalDateTime` sin zona. La fecha y la hora se sacan
   * troceando el texto; pasarlo por `new Date()` movería de día las ventas de
   * la noche — el fallo de la regla §2.9.
   */
  it('parte fecha y hora sin construir un `Date`', () => {
    const csv = aCsv([venta('a', '2026-09-21T22:40:00', 10, null)], nombres);
    expect(filas(csv)[1]).toContain('2026-09-21;22:40');
  });

  it('una venta sin cliente dice «Mostrador», no deja la celda vacía', () => {
    const csv = aCsv([venta('a', '2026-09-21T09:00:00', 10, null)], nombres);
    expect(filas(csv)[1]).toContain('Mostrador');
  });

  it('resuelve el nombre del cliente cuando lo hay', () => {
    const csv = aCsv([venta('a', '2026-09-21T09:00:00', 10, 'c-1')], nombres);
    expect(filas(csv)[1]).toContain('Luis Chavez');
  });

  it('los importes llevan coma decimal, que es lo que Excel espera aquí', () => {
    const csv = aCsv([venta('a', '2026-09-21T09:00:00', 3.6, null)], nombres);
    expect(filas(csv)[1]).toContain('3,60');
  });

  it('las anuladas salen marcadas, no se esconden', () => {
    const csv = aCsv([venta('a', '2026-09-21T09:00:00', 10, null, true)], nombres);
    expect(filas(csv)[1]).toMatch(/;Sí$/);
  });

  it('el total de cierre no cuenta las anuladas', () => {
    const csv = aCsv(
      [
        venta('a', '2026-09-21T09:00:00', 10, null),
        venta('b', '2026-09-21T10:00:00', 90, null, true),
      ],
      nombres,
    );

    expect(filas(csv).at(-1)).toBe(';;;;Total;10,00;');
  });

  /**
   * Sin escapar, un cliente llamado «Pérez; Juan» corre una columna todas las
   * de su fila y el archivo deja de cuadrar a partir de ahí.
   */
  it('entrecomilla lo que lleva el separador', () => {
    const csv = aCsv([venta('a', '2026-09-21T09:00:00', 10, 'c-1')], () => 'Pérez; Juan');
    expect(filas(csv)[1]).toContain('"Pérez; Juan"');
  });

  it('duplica las comillas de dentro', () => {
    const csv = aCsv([venta('a', '2026-09-21T09:00:00', 10, 'c-1')], () => 'El "Chino"');
    expect(filas(csv)[1]).toContain('"El ""Chino"""');
  });
});

describe('nombreDelReporte', () => {
  it('lleva fecha y hora, para no acabar en «reporte (3).csv»', () => {
    expect(nombreDelReporte(new Date(2026, 8, 21, 9, 5))).toBe('ventas-2026-09-21-0905.csv');
  });
});
