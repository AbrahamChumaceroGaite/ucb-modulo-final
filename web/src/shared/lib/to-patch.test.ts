import { describe, expect, it } from 'vitest';
import { toPatch } from './to-patch';

/**
 * El PATCH es donde el proyecto auditado perdía datos: mandaba el registro
 * entero y los campos que alguien había vaciado volvían con su valor viejo.
 * Estas pruebas fijan la única distinción que evita eso.
 */
describe('toPatch', () => {
  it('no manda lo que no cambió', () => {
    const original = { nombre: 'House Espresso', precio: 92 };
    expect(toPatch(original, { nombre: 'House Espresso', precio: 92 })).toEqual({});
  });

  it('manda solo el campo que cambió', () => {
    const original = { nombre: 'House Espresso', precio: 92 };
    expect(toPatch(original, { nombre: 'House Espresso', precio: 95 })).toEqual({ precio: 95 });
  });

  it('`undefined` significa «no lo toques» y no viaja', () => {
    const original = { nombre: 'House Espresso', notas: 'Doble carga' };
    expect(toPatch(original, { nombre: 'House Espresso', notas: undefined })).toEqual({});
  });

  it('`null` significa «bórralo» y SÍ viaja', () => {
    // El tipo tiene que admitir `null` para que borrar sea representable: si
    // el campo es `string | undefined`, vaciarlo no se puede ni escribir.
    const original: { nombre: string; notas: string | null } = {
      nombre: 'House Espresso',
      notas: 'Doble carga',
    };
    const cambios = toPatch(original, { nombre: 'House Espresso', notas: null });

    expect(cambios).toEqual({ notas: null });
    // `toEqual` daría por bueno un objeto sin la clave: hay que comprobar que
    // la clave existe, porque es justo lo que distingue borrar de no tocar.
    expect(Object.hasOwn(cambios, 'notas')).toBe(true);
  });

  it('distingue borrar de dejar igual cuando el original ya era nulo', () => {
    const original: { notas: string | null } = { notas: null };
    expect(toPatch(original, { notas: null })).toEqual({});
  });

  it('compara arrays elemento a elemento, no por referencia', () => {
    const original = { etiquetas: ['café', 'tueste'] };
    expect(toPatch(original, { etiquetas: ['café', 'tueste'] })).toEqual({});
    expect(toPatch(original, { etiquetas: ['café'] })).toEqual({ etiquetas: ['café'] });
  });
});

/**
 * Las recetas trajeron listas de objetos, y con ellas el primer caso donde la
 * comparación por referencia mentía: el formulario reconstruye los objetos en
 * cada render, así que dos listas idénticas salían como cambiadas y el PATCH
 * mandaba las listas enteras en cada guardado. Estas pruebas lo fijan.
 */
describe('toPatch con listas de objetos', () => {
  const original = {
    titulo: 'Capuchino',
    ingredientes: [
      { idProducto: 'pr-16', cantidad: 18 },
      { idProducto: 'pr-18', cantidad: 150 },
    ],
  };

  it('dos listas con el mismo contenido no son un cambio', () => {
    const copia = { ...original, ingredientes: original.ingredientes.map((uno) => ({ ...uno })) };
    expect(toPatch(original, copia)).toEqual({});
  });

  it('cambiar una cantidad dentro de la lista sí es un cambio', () => {
    const cambiado = {
      ...original,
      ingredientes: [{ idProducto: 'pr-16', cantidad: 20 }, original.ingredientes[1]!],
    };

    expect(toPatch(original, cambiado).ingredientes).toHaveLength(2);
  });

  it('quitar un elemento es un cambio', () => {
    const cambiado = { ...original, ingredientes: [original.ingredientes[0]!] };
    expect(toPatch(original, cambiado).ingredientes).toHaveLength(1);
  });

  it('el orden cuenta: una lista reordenada es otra lista', () => {
    const cambiado = { ...original, ingredientes: [...original.ingredientes].reverse() };
    expect(toPatch(original, cambiado).ingredientes).toBeDefined();
  });

  it('`null` dentro de un objeto sigue distinguiéndose de `undefined`', () => {
    // La distinción de la cabecera de `to-patch.ts`, ahora también un nivel
    // más adentro: dos objetos no son iguales porque uno tenga la clave vacía.
    const original: { dato: { valor: string | null } } = { dato: { valor: null } };
    const actual: { dato: { valor: string | null } } = { dato: { valor: 'algo' } };

    expect(toPatch(original, actual)).toEqual({ dato: { valor: 'algo' } });
    expect(toPatch(original, { dato: { valor: null } })).toEqual({});
  });
});
