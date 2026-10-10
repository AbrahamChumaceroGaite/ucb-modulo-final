import { describe, expect, it } from 'vitest';
import { aActualizacion, aFormulario } from './receta.mapper';
import type { Receta } from './receta.schema';

const receta: Receta = {
  id: 'r-1',
  titulo: 'Capuchino',
  cantidad: 1,
  idProductoObtenido: 'pr-11',
  ingredientes: [
    { id: 'ing-1', idProducto: 'pr-16', cantidad: 18, borrado: false },
    { id: 'ing-2', idProducto: 'pr-18', cantidad: 150, borrado: false },
    { id: 'ing-3', idProducto: 'pr-21', cantidad: 5, borrado: true },
  ],
  pasos: [
    { id: 'p-2', pasos: 2, descripcion: 'Vaporizar la leche', borrado: false },
    { id: 'p-1', pasos: 1, descripcion: 'Extraer el espresso', borrado: false },
    { id: 'p-3', pasos: 3, descripcion: 'Paso retirado', borrado: true },
  ],
  borrado: false,
};

describe('aFormulario', () => {
  it('ordena los pasos por su número: el orden es el significado de un paso', () => {
    expect(aFormulario(receta).pasos.map((paso) => paso.descripcion)).toEqual([
      'Extraer el espresso',
      'Vaporizar la leche',
    ]);
  });

  it('deja fuera lo dado de baja, que si no reaparecería al guardar', () => {
    const valores = aFormulario(receta);
    expect(valores.ingredientes).toHaveLength(2);
    expect(valores.pasos).toHaveLength(2);
  });

  it('no arrastra los ids de ingredientes ni pasos: el alta no los acepta', () => {
    const valores = aFormulario(receta);
    expect(Object.keys(valores.ingredientes[0] ?? {})).toEqual(['idProducto', 'cantidad']);
    expect(Object.keys(valores.pasos[0] ?? {})).toEqual(['descripcion']);
  });
});

describe('aActualizacion', () => {
  it('sin cambios no manda nada', () => {
    expect(aActualizacion(receta, aFormulario(receta))).toEqual({});
  });

  it('solo viaja el campo que cambió', () => {
    const cambios = aActualizacion(receta, { ...aFormulario(receta), titulo: 'Capuchino doble' });
    expect(cambios).toEqual({ titulo: 'Capuchino doble' });
  });

  it('cambiar un ingrediente manda la lista entera: la API no acepta medias listas', () => {
    const valores = aFormulario(receta);
    const cambios = aActualizacion(receta, {
      ...valores,
      ingredientes: [{ idProducto: 'pr-16', cantidad: 20 }, ...valores.ingredientes.slice(1)],
    });

    expect(cambios.ingredientes).toHaveLength(2);
    expect(cambios.titulo).toBeUndefined();
  });

  it('reordenar los pasos cuenta como cambio', () => {
    const valores = aFormulario(receta);
    const cambios = aActualizacion(receta, { ...valores, pasos: [...valores.pasos].reverse() });
    expect(cambios.pasos).toHaveLength(2);
  });
});
