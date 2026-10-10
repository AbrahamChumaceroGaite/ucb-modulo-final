import { describe, expect, it } from 'vitest';
import { alternar, escribirLista, leerLista } from './params-lista';

/**
 * El puente entre la URL y los filtros de varios valores. Se prueba porque es
 * lo que sostiene la promesa de que una lista acotada se puede compartir por
 * enlace: si la ida y la vuelta no coinciden, el enlace miente.
 */
describe('params-lista', () => {
  it('sin el parámetro, no hay nada puesto', () => {
    expect(leerLista(new URLSearchParams(''), 'categoria')).toEqual([]);
  });

  it('lee varios valores de un parámetro', () => {
    expect(leerLista(new URLSearchParams('categoria=a,b'), 'categoria')).toEqual(['a', 'b']);
  });

  it('un parámetro vacío no produce un valor vacío', () => {
    expect(leerLista(new URLSearchParams('categoria='), 'categoria')).toEqual([]);
  });

  it('la lista vacía borra el parámetro en vez de dejarlo en blanco', () => {
    expect(escribirLista([])).toBeNull();
  });

  it('lo escrito se vuelve a leer igual', () => {
    const escrito = escribirLista(['a', 'b']) ?? '';
    expect(leerLista(new URLSearchParams(`categoria=${escrito}`), 'categoria')).toEqual(['a', 'b']);
  });

  it('pulsar un chip que no estaba lo añade', () => {
    expect(alternar(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('pulsar un chip que ya estaba lo quita', () => {
    expect(alternar(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('no muta la lista que recibe', () => {
    const original = ['a'];
    alternar(original, 'b');
    expect(original).toEqual(['a']);
  });
});
