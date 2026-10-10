import { describe, expect, it } from 'vitest';
import {
  lineasVigentes,
  subtotalDeLinea,
  totalProvisional,
  type Venta,
} from './venta.schema';

const linea = (precioUnitario: number, cantidad: number, descuentoAplicado = 0) => ({
  precioUnitario,
  cantidad,
  descuentoAplicado,
});

/**
 * Cómo se suma una venta.
 *
 * Es una regla de negocio —dónde resta el descuento— y por eso vive en el
 * dominio y se prueba sin montar pantalla. Lo que fija esta tabla es que el
 * descuento se aplica **sobre el importe de la línea**, no sobre el precio
 * unitario: 2 cafés de 10 con 5 de descuento son 15, no 10.
 *
 * Y una aclaración que importa: esto **no** es el total de la venta guardada.
 * Ese lo calcula el servidor y llega en `venta.total`. Esto es lo que se
 * enseña mientras se teclea, antes de que exista ninguna respuesta.
 */
describe('subtotalDeLinea', () => {
  it('multiplica precio por cantidad', () => {
    expect(subtotalDeLinea(linea(10, 2))).toBe(20);
  });

  it('el descuento resta sobre el importe de la línea, no sobre el precio', () => {
    // Si restara del precio unitario, saldrían 10. Son 15.
    expect(subtotalDeLinea(linea(10, 2, 5))).toBe(15);
  });

  it('un descuento mayor que la línea no genera dinero a devolver', () => {
    expect(subtotalDeLinea(linea(10, 1, 50))).toBe(0);
  });

  it('aguanta decimales, que es como son los precios de verdad', () => {
    expect(subtotalDeLinea(linea(0.17, 3))).toBeCloseTo(0.51, 2);
  });
});

describe('totalProvisional', () => {
  it('suma las líneas ya con su descuento', () => {
    expect(totalProvisional([linea(10, 2, 5), linea(4, 3)])).toBe(27);
  });

  it('sin líneas es cero, no NaN', () => {
    expect(totalProvisional([])).toBe(0);
  });
});

describe('lineasVigentes', () => {
  it('deja fuera las dadas de baja: el borrado es lógico y siguen llegando', () => {
    const venta = {
      detalles: [
        { id: 'd-1', borrado: false },
        { id: 'd-2', borrado: true },
      ],
    } as Venta;

    expect(lineasVigentes(venta).map((detalle) => detalle.id)).toEqual(['d-1']);
  });
});
