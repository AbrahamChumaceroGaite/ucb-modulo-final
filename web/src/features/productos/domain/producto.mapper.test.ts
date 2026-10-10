import { describe, expect, it } from 'vitest';
import type { Producto } from './producto.schema';
import { aActualizacion, aFormulario } from './producto.mapper';

const producto: Producto = {
  id: 'pr-1',
  nombre: 'Kaffe en grano',
  stock: 1500,
  precio: 0.5,
  stockMinimo: 500,
  vendible: true,
  unidadActual: {
    id: 'uni-g',
    unidad: 'gramos',
    abreviatura: 'g',
    esBorrable: false,
    borrado: false,
  },
  categoria: { id: 'cat-cafes', nombre: 'Cafes', esBorrable: false, borrado: false },
  idProductoPadre: null,
  borrado: false,
};

describe('aFormulario', () => {
  it('aplana las dos referencias a sus ids', () => {
    expect(aFormulario(producto)).toEqual({
      nombre: 'Kaffe en grano',
      stock: 1500,
      precio: 0.5,
      stockMinimo: 500,
      vendible: true,
      idUnidadActual: 'uni-g',
      idCategoria: 'cat-cafes',
      idProductoPadre: '',
    });
  });

  it('«sin padre» llega al formulario como texto vacío, no como null', () => {
    expect(aFormulario(producto).idProductoPadre).toBe('');
  });

  it('una referencia ausente no rompe: sale como cadena vacía', () => {
    const suelto = { ...producto, categoria: null, unidadActual: null };
    const valores = aFormulario(suelto);

    expect(valores.idCategoria).toBe('');
    expect(valores.idUnidadActual).toBe('');
  });
});

describe('aActualizacion', () => {
  it('sin cambios no manda nada', () => {
    expect(aActualizacion(producto, aFormulario(producto))).toEqual({});
  });

  it('manda solo el campo que cambió', () => {
    const valores = { ...aFormulario(producto), precio: 0.75 };
    expect(aActualizacion(producto, valores)).toEqual({ precio: 0.75 });
  });

  it('cambiar de tipo manda el id', () => {
    const valores = { ...aFormulario(producto), idTipo: 'tipo-producto' };
    expect(aActualizacion(producto, valores)).toEqual({ idTipo: 'tipo-producto' });
  });

  it('quitar el padre viaja como cadena vacía, que la API traduce a null', () => {
    const conPadre = { ...producto, idProductoPadre: 'pr-18' };
    const valores = { ...aFormulario(conPadre), idProductoPadre: '' };

    expect(aActualizacion(conPadre, valores)).toEqual({ idProductoPadre: '' });
  });
});
