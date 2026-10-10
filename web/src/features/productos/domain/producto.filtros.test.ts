import { describe, expect, it } from 'vitest';
import type { Producto } from './producto.schema';
import { filtrarProductos, type FiltrosDeProducto } from './producto.filtros';

/**
 * «Nada puesto», que es como arranca la pantalla. Vive aquí y no en el
 * dominio: exportarlo desde `producto.filtros.ts` creaba una constante que
 * solo usaba esta prueba, y eso es un resto — lo cazó `audit-muertos`.
 */
const SIN_FILTROS_DE_PRODUCTO: FiltrosDeProducto = {
  estado: [],
  categorias: [],
  vendible: [],
};

const unidad = {
  id: 'uni-g',
  unidad: 'gramos',
  abreviatura: 'g',
  esBorrable: false,
  borrado: false,
};
const cafes = { id: 'cat-cafes', nombre: 'Cafes', esBorrable: false, borrado: false };
const masas = { id: 'cat-masas', nombre: 'Masas', esBorrable: true, borrado: false };

const producto = (id: string, parcial: Partial<Producto> = {}): Producto => ({
  id,
  nombre: id,
  stock: 10,
  precio: 1,
  stockMinimo: 0,
  vendible: true,
  unidadActual: unidad,
  categoria: cafes,
  idProductoPadre: null,
  borrado: false,
  ...parcial,
});

const filas = [
  producto('a'),
  producto('b', { categoria: masas }),
  producto('c', { borrado: true }),
  producto('d', { vendible: false, categoria: masas }),
  producto('e', { categoria: null }),
];

const ids = (lista: readonly Producto[]) => lista.map((fila) => fila.id);

/**
 * Los filtros son de **selección múltiple** y todos son listas. Estas pruebas
 * fijan las dos decisiones que se pueden malinterpretar: que la lista vacía es
 * «todos» y no «ninguno», y que varios filtros distintos se suman mientras que
 * varios valores del mismo filtro se acumulan.
 */
describe('filtrarProductos', () => {
  it('sin filtros se devuelve todo, incluidos los dados de baja', () => {
    expect(ids(filtrarProductos(filas, SIN_FILTROS_DE_PRODUCTO))).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
  });

  it('«Activos» esconde los dados de baja', () => {
    const acotado = filtrarProductos(filas, { ...SIN_FILTROS_DE_PRODUCTO, estado: ['activos'] });
    expect(ids(acotado)).toEqual(['a', 'b', 'd', 'e']);
  });

  it('«Dados de baja» enseña solo esos', () => {
    const acotado = filtrarProductos(filas, { ...SIN_FILTROS_DE_PRODUCTO, estado: ['baja'] });
    expect(ids(acotado)).toEqual(['c']);
  });

  it('elegir los dos estados es lo mismo que no elegir ninguno', () => {
    const ambos = filtrarProductos(filas, {
      ...SIN_FILTROS_DE_PRODUCTO,
      estado: ['activos', 'baja'],
    });
    expect(ids(ambos)).toEqual(ids(filtrarProductos(filas, SIN_FILTROS_DE_PRODUCTO)));
  });

  it('la categoría acota por id, no por nombre', () => {
    const acotado = filtrarProductos(filas, {
      ...SIN_FILTROS_DE_PRODUCTO,
      categorias: ['cat-masas'],
    });
    expect(ids(acotado)).toEqual(['b', 'd']);
  });

  it('varias categorías se acumulan: es una unión, no una intersección', () => {
    const acotado = filtrarProductos(filas, {
      ...SIN_FILTROS_DE_PRODUCTO,
      categorias: ['cat-masas', 'cat-cafes'],
    });
    expect(ids(acotado)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('un producto sin categoría no entra al filtrar por categoría', () => {
    const acotado = filtrarProductos(filas, {
      ...SIN_FILTROS_DE_PRODUCTO,
      categorias: ['cat-cafes'],
    });
    expect(ids(acotado)).not.toContain('e');
  });

  it('«Se vende» y «Solo despensa» son dos subconjuntos distintos', () => {
    expect(
      ids(filtrarProductos(filas, { ...SIN_FILTROS_DE_PRODUCTO, vendible: ['no'] })),
    ).toEqual(['d']);
    expect(
      ids(filtrarProductos(filas, { ...SIN_FILTROS_DE_PRODUCTO, vendible: ['si'] })),
    ).toEqual(['a', 'b', 'c', 'e']);
  });

  it('filtros distintos sí se cruzan entre ellos', () => {
    const acotado = filtrarProductos(filas, {
      estado: ['activos'],
      categorias: ['cat-masas'],
      vendible: ['si'],
    });
    expect(ids(acotado)).toEqual(['b']);
  });

  it('no muta la lista que recibe', () => {
    const copia = [...filas];
    filtrarProductos(filas, { ...SIN_FILTROS_DE_PRODUCTO, estado: ['baja'] });
    expect(filas).toEqual(copia);
  });
});
