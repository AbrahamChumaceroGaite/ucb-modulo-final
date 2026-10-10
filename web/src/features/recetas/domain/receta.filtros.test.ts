import { describe, expect, it } from 'vitest';
import { filtrarRecetas, type FiltrosDeReceta } from './receta.filtros';
import type { Receta } from './receta.schema';

/** «Nada puesto». Aquí y no en el dominio: allí solo lo usaría esta prueba. */
const SIN_FILTROS: FiltrosDeReceta = { estado: [], productos: [] };

const receta = (id: string, idProductoObtenido: string, borrado = false): Receta => ({
  id,
  titulo: id,
  cantidad: 1,
  idProductoObtenido,
  ingredientes: [],
  pasos: [],
  borrado,
});

const filas = [
  receta('a', 'pr-11'),
  receta('b', 'pr-12'),
  receta('c', 'pr-11', true),
];

const ids = (lista: readonly Receta[]) => lista.map((fila) => fila.id);

describe('filtrarRecetas', () => {
  it('sin filtros devuelve todo, incluidas las dadas de baja', () => {
    expect(ids(filtrarRecetas(filas, SIN_FILTROS))).toEqual(['a', 'b', 'c']);
  });

  it('«Activas» esconde las dadas de baja', () => {
    expect(ids(filtrarRecetas(filas, { ...SIN_FILTROS, estado: ['activos'] }))).toEqual(['a', 'b']);
  });

  it('elegir los dos estados es lo mismo que no elegir ninguno', () => {
    const ambos = filtrarRecetas(filas, { ...SIN_FILTROS, estado: ['activos', 'baja'] });
    expect(ids(ambos)).toEqual(ids(filtrarRecetas(filas, SIN_FILTROS)));
  });

  it('el producto obtenido acota por id', () => {
    expect(ids(filtrarRecetas(filas, { ...SIN_FILTROS, productos: ['pr-12'] }))).toEqual(['b']);
  });

  it('varios productos se acumulan: es una unión, no una intersección', () => {
    const acotado = filtrarRecetas(filas, { ...SIN_FILTROS, productos: ['pr-11', 'pr-12'] });
    expect(ids(acotado)).toEqual(['a', 'b', 'c']);
  });

  it('filtros distintos sí se cruzan', () => {
    const acotado = filtrarRecetas(filas, { estado: ['activos'], productos: ['pr-11'] });
    expect(ids(acotado)).toEqual(['a']);
  });

  it('no muta la lista que recibe', () => {
    const copia = [...filas];
    filtrarRecetas(filas, { ...SIN_FILTROS, estado: ['baja'] });
    expect(filas).toEqual(copia);
  });
});
