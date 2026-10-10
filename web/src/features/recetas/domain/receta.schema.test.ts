import { describe, expect, it } from 'vitest';
import { ingredientesQueFaltan, tandasPosibles, type Receta } from './receta.schema';

const ingrediente = (idProducto: string, cantidad: number, borrado = false) => ({
  id: `ing-${idProducto}`,
  idProducto,
  cantidad,
  borrado,
});

const receta = (ingredientes: Receta['ingredientes']): Receta => ({
  id: 'r-1',
  titulo: 'Capuchino',
  cantidad: 1,
  idProductoObtenido: 'pr-11',
  ingredientes,
  pasos: [],
  borrado: false,
});

const despensa = (entradas: Record<string, number>) => new Map(Object.entries(entradas));

/**
 * «¿Me da para el turno?» es la pregunta que se hace en una barra, y es una
 * regla de negocio: vive en el dominio y se prueba sin montar pantalla.
 *
 * Lo que más importa aquí es el caso que **no** se puede contestar. Devolver
 * cero cuando falta información diría «no hay existencias», que es una
 * afirmación distinta de «no lo sé» — y la pantalla las pinta distinto.
 */
describe('tandasPosibles', () => {
  it('manda el ingrediente que menos alcanza', () => {
    const cuantas = tandasPosibles(
      receta([ingrediente('cafe', 10), ingrediente('leche', 100)]),
      despensa({ cafe: 100, leche: 250 }),
    );

    // Café da para 10, leche para 2. Salen 2.
    expect(cuantas).toBe(2);
  });

  it('no parte tandas: con lo justo para media, sale cero', () => {
    expect(tandasPosibles(receta([ingrediente('cafe', 10)]), despensa({ cafe: 5 }))).toBe(0);
  });

  it('devuelve null si un ingrediente no está en la despensa: es «no lo sé», no «no hay»', () => {
    expect(tandasPosibles(receta([ingrediente('cafe', 10)]), despensa({}))).toBeNull();
  });

  it('una receta sin ingredientes vigentes no se puede evaluar', () => {
    expect(tandasPosibles(receta([ingrediente('cafe', 10, true)]), despensa({ cafe: 50 }))).toBeNull();
  });

  it('un ingrediente dado de baja no limita: ya no es parte de la receta', () => {
    const cuantas = tandasPosibles(
      receta([ingrediente('cafe', 10), ingrediente('oro', 1000, true)]),
      despensa({ cafe: 100, oro: 0 }),
    );

    expect(cuantas).toBe(10);
  });

  it('un ingrediente de cantidad cero no vuelve infinito el resultado', () => {
    const cuantas = tandasPosibles(
      receta([ingrediente('cafe', 10), ingrediente('agua', 0)]),
      despensa({ cafe: 30, agua: 0 }),
    );

    expect(cuantas).toBe(3);
  });
});

describe('ingredientesQueFaltan', () => {
  it('señala solo los que no llegan a una tanda', () => {
    const faltan = ingredientesQueFaltan(
      receta([ingrediente('cafe', 10), ingrediente('leche', 100)]),
      despensa({ cafe: 100, leche: 50 }),
    );

    expect(faltan.map((uno) => uno.idProducto)).toEqual(['leche']);
  });

  it('lo que no está en la despensa no se declara faltante: no se sabe', () => {
    const faltan = ingredientesQueFaltan(receta([ingrediente('cafe', 10)]), despensa({}));
    expect(faltan).toEqual([]);
  });

  it('lo dado de baja no falta', () => {
    const faltan = ingredientesQueFaltan(
      receta([ingrediente('cafe', 10, true)]),
      despensa({ cafe: 0 }),
    );

    expect(faltan).toEqual([]);
  });
});
