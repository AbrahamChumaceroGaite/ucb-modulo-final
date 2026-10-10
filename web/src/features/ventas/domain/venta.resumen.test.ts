import { describe, expect, it } from 'vitest';
import { ingresoPorDia, ingresoPorProducto, ventasPorEstado } from './venta.resumen';
import type { Venta } from './venta.schema';

const linea = (idProducto: string, subtotal: number, borrado = false) => ({
  id: `d-${idProducto}`,
  idProducto,
  precioUnitario: subtotal,
  cantidad: 1,
  subtotal,
  descuentoAplicado: 0,
  estado: true,
  borrado,
});

const venta = (
  id: string,
  fechaVenta: string,
  total: number,
  estado: string,
  detalles: Venta['detalles'] = [],
  borrado = false,
): Venta => ({
  id,
  fechaVenta,
  total,
  idUsuario: 'u-1',
  idCliente: null,
  estadoVenta: { id: estado, nombre: estado, borrado: false },
  detalles,
  borrado,
});

/**
 * Lo que alimenta los gráficos.
 *
 * La decisión que estas pruebas fijan es **qué entra en cada suma**, y tiene
 * que coincidir con lo que enseña la pantalla encima de la lista: si el
 * gráfico contara las anuladas y el total no, las dos cifras vendrían de las
 * mismas filas y dirían cosas distintas.
 */
describe('ingresoPorDia', () => {
  it('agrupa por día y ordena cronológicamente', () => {
    const serie = ingresoPorDia([
      venta('b', '2026-09-22T10:00:00', 20, 'Pagada'),
      venta('a', '2026-09-21T09:00:00', 30, 'Pagada'),
      venta('c', '2026-09-21T18:00:00', 10, 'Pagada'),
    ]);

    expect(serie).toEqual([
      { etiqueta: '21/09', valor: 40 },
      { etiqueta: '22/09', valor: 20 },
    ]);
  });

  /**
   * El caso que se rompe solo: una venta de las 22:40 pertenece al día 21. Si
   * esto construyera un `Date`, el navegador le pondría su zona y la barra
   * saltaría de día — el fallo de la regla §2.9, que ya se coló una vez.
   */
  it('una venta de la noche cuenta en su propio día', () => {
    const serie = ingresoPorDia([venta('a', '2026-09-21T22:40:00', 10, 'Pagada')]);
    expect(serie).toEqual([{ etiqueta: '21/09', valor: 10 }]);
  });

  it('una venta anulada no suma', () => {
    const serie = ingresoPorDia([
      venta('a', '2026-09-21T09:00:00', 30, 'Pagada'),
      venta('b', '2026-09-21T10:00:00', 70, 'Anulada', [], true),
    ]);

    expect(serie).toEqual([{ etiqueta: '21/09', valor: 30 }]);
  });

  it('un día con solo ventas anuladas no aparece: no hubo ingreso', () => {
    const serie = ingresoPorDia([venta('a', '2026-09-21T09:00:00', 30, 'Anulada', [], true)]);
    expect(serie).toEqual([]);
  });

  it('sin ventas, una serie vacía y no NaN', () => {
    expect(ingresoPorDia([])).toEqual([]);
  });
});

describe('ventasPorEstado', () => {
  it('cuenta cuántas hay en cada estado, de más a menos', () => {
    const serie = ventasPorEstado([
      venta('a', '2026-09-21T09:00:00', 10, 'Pagada'),
      venta('b', '2026-09-21T10:00:00', 10, 'Pendiente'),
      venta('c', '2026-09-21T11:00:00', 10, 'Pagada'),
    ]);

    expect(serie).toEqual([
      { etiqueta: 'Pagada', valor: 2 },
      { etiqueta: 'Pendiente', valor: 1 },
    ]);
  });

  it('aquí las anuladas SÍ cuentan: la pregunta es cómo quedaron', () => {
    const serie = ventasPorEstado([
      venta('a', '2026-09-21T09:00:00', 10, 'Anulada', [], true),
    ]);

    expect(serie).toEqual([{ etiqueta: 'Anulada', valor: 1 }]);
  });

  it('una venta sin estado no se pierde: se agrupa aparte', () => {
    const suelta = { ...venta('a', '2026-09-21T09:00:00', 10, 'x'), estadoVenta: null };
    expect(ventasPorEstado([suelta])).toEqual([{ etiqueta: 'Sin estado', valor: 1 }]);
  });
});

describe('ingresoPorProducto', () => {
  const nombre = (id: string) => ({ 'pr-1': 'Café', 'pr-2': 'Galletas' })[id] ?? id;

  it('suma por importe y devuelve los primeros', () => {
    const serie = ingresoPorProducto(
      [
        venta('a', '2026-09-21T09:00:00', 30, 'Pagada', [linea('pr-1', 10), linea('pr-2', 20)]),
        venta('b', '2026-09-21T10:00:00', 5, 'Pagada', [linea('pr-1', 5)]),
      ],
      nombre,
    );

    expect(serie).toEqual([
      { etiqueta: 'Galletas', valor: 20 },
      { etiqueta: 'Café', valor: 15 },
    ]);
  });

  it('las líneas dadas de baja y las ventas anuladas no cuentan', () => {
    const serie = ingresoPorProducto(
      [
        venta('a', '2026-09-21T09:00:00', 10, 'Pagada', [linea('pr-1', 10), linea('pr-2', 99, true)]),
        venta('b', '2026-09-21T10:00:00', 99, 'Anulada', [linea('pr-2', 99)], true),
      ],
      nombre,
    );

    expect(serie).toEqual([{ etiqueta: 'Café', valor: 10 }]);
  });

  it('recorta a los que se piden', () => {
    const detalles = [linea('a', 5), linea('b', 4), linea('c', 3)];
    const serie = ingresoPorProducto(
      [venta('v', '2026-09-21T09:00:00', 12, 'Pagada', detalles)],
      (id) => id,
      2,
    );

    expect(serie).toHaveLength(2);
  });

  it('un id sin nombre resuelto se enseña tal cual, no se inventa', () => {
    const serie = ingresoPorProducto(
      [venta('v', '2026-09-21T09:00:00', 5, 'Pagada', [linea('pr-99', 5)])],
      nombre,
    );

    expect(serie).toEqual([{ etiqueta: 'pr-99', valor: 5 }]);
  });
});
