import { describe, expect, it } from 'vitest';
import { aActualizacion, aFormulario } from './venta.mapper';
import type { Venta } from './venta.schema';

const venta: Venta = {
  id: 'v-1',
  fechaVenta: '2026-09-21T10:15:30',
  total: 27,
  idUsuario: 'u-3',
  idCliente: 'c-1',
  estadoVenta: { id: 'ev-pagada', nombre: 'Pagada', borrado: false },
  detalles: [
    {
      id: 'd-1',
      idProducto: 'pr-11',
      precioUnitario: 10,
      cantidad: 2,
      subtotal: 15,
      descuentoAplicado: 5,
      estado: true,
      borrado: false,
    },
    {
      id: 'd-2',
      idProducto: 'pr-4',
      precioUnitario: 4,
      cantidad: 3,
      subtotal: 12,
      descuentoAplicado: 0,
      estado: true,
      borrado: false,
    },
    {
      id: 'd-3',
      idProducto: 'pr-8',
      precioUnitario: 1,
      cantidad: 1,
      subtotal: 1,
      descuentoAplicado: 0,
      estado: true,
      borrado: true,
    },
  ],
  borrado: false,
};

describe('aFormulario', () => {
  it('no arrastra lo que calcula el servidor: ni total ni subtotales', () => {
    const valores = aFormulario(venta);

    expect(valores).not.toHaveProperty('total');
    expect(Object.keys(valores.detalles[0] ?? {})).toEqual([
      'idProducto',
      'precioUnitario',
      'cantidad',
      'descuentoAplicado',
    ]);
  });

  it('no arrastra el vendedor ni la fecha: los pone la sesión y el servidor', () => {
    const valores = aFormulario(venta);

    expect(valores).not.toHaveProperty('idUsuario');
    expect(valores).not.toHaveProperty('fechaVenta');
  });

  it('deja fuera las líneas dadas de baja, que si no reaparecerían al guardar', () => {
    expect(aFormulario(venta).detalles).toHaveLength(2);
  });

  it('el estado llega como su id, no como su nombre', () => {
    expect(aFormulario(venta).idEstadoVenta).toBe('ev-pagada');
  });

  it('una venta sin cliente llega al formulario como texto vacío, no como null', () => {
    expect(aFormulario({ ...venta, idCliente: null }).idCliente).toBe('');
  });
});

describe('aActualizacion', () => {
  it('sin cambios no manda nada', () => {
    expect(aActualizacion(venta, aFormulario(venta))).toEqual({});
  });

  it('solo viaja el campo que cambió', () => {
    const cambios = aActualizacion(venta, {
      ...aFormulario(venta),
      idEstadoVenta: 'ev-anulada',
    });

    expect(cambios).toEqual({ idEstadoVenta: 'ev-anulada' });
  });

  it('cambiar una línea manda la lista entera: la API no acepta medias listas', () => {
    const valores = aFormulario(venta);
    const cambios = aActualizacion(venta, {
      ...valores,
      detalles: [{ ...valores.detalles[0]!, cantidad: 5 }, valores.detalles[1]!],
    });

    expect(cambios.detalles).toHaveLength(2);
    expect(cambios.idEstadoVenta).toBeUndefined();
  });

  it('quitar el cliente sí viaja: «sin cliente» es una decisión', () => {
    const cambios = aActualizacion(venta, { ...aFormulario(venta), idCliente: '' });
    expect(cambios).toEqual({ idCliente: '' });
  });
});
