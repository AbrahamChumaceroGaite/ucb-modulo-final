import { describe, expect, it } from 'vitest';
import { filtrarVentas, totalDeLoMostrado, type FiltrosDeVenta } from './venta.filtros';
import type { Venta } from './venta.schema';

/** «Nada puesto». Aquí y no en el dominio: allí solo lo usaría esta prueba. */
const SIN_FILTROS: FiltrosDeVenta = { estado: [], estados: [], desde: '', hasta: '' };

const venta = (
  id: string,
  fechaVenta: string,
  idEstado: string,
  total = 100,
  borrado = false,
): Venta => ({
  id,
  fechaVenta,
  total,
  idUsuario: 'u-1',
  idCliente: null,
  estadoVenta: { id: idEstado, nombre: idEstado, borrado: false },
  detalles: [],
  borrado,
});

const filas = [
  venta('a', '2026-09-20T09:00:00', 'ev-pagada', 50),
  venta('b', '2026-09-21T22:40:00', 'ev-pagada', 30),
  venta('c', '2026-09-22T11:00:00', 'ev-anulada', 20, true),
];

const ids = (lista: readonly Venta[]) => lista.map((fila) => fila.id);

describe('filtrarVentas', () => {
  it('sin filtros devuelve todo, incluidas las dadas de baja', () => {
    expect(ids(filtrarVentas(filas, SIN_FILTROS))).toEqual(['a', 'b', 'c']);
  });

  it('«Activas» esconde las dadas de baja', () => {
    expect(ids(filtrarVentas(filas, { ...SIN_FILTROS, estado: ['activas'] }))).toEqual(['a', 'b']);
  });

  it('el estado de venta acota por id', () => {
    const acotado = filtrarVentas(filas, { ...SIN_FILTROS, estados: ['ev-anulada'] });
    expect(ids(acotado)).toEqual(['c']);
  });

  it('varios estados se acumulan: es una unión, no una intersección', () => {
    const acotado = filtrarVentas(filas, {
      ...SIN_FILTROS,
      estados: ['ev-pagada', 'ev-anulada'],
    });
    expect(ids(acotado)).toEqual(['a', 'b', 'c']);
  });

  it('«desde» incluye el propio día', () => {
    expect(ids(filtrarVentas(filas, { ...SIN_FILTROS, desde: '2026-09-21' }))).toEqual(['b', 'c']);
  });

  it('«hasta» incluye el propio día', () => {
    expect(ids(filtrarVentas(filas, { ...SIN_FILTROS, hasta: '2026-09-21' }))).toEqual(['a', 'b']);
  });

  it('los dos extremos acotan un intervalo cerrado', () => {
    const acotado = filtrarVentas(filas, {
      ...SIN_FILTROS,
      desde: '2026-09-21',
      hasta: '2026-09-21',
    });
    expect(ids(acotado)).toEqual(['b']);
  });

  /**
   * El fallo que esta prueba impide: una venta de las 22:40 pertenece al día
   * 21 y tiene que seguir perteneciendo al 21. Si el filtro construyera un
   * `Date` a partir de un `LocalDateTime` sin zona, el navegador le pondría la
   * suya y esa venta se movería de día — hacia delante o hacia atrás según el
   * signo del desfase. Por eso se comparan cadenas y nunca se crea un `Date`.
   */
  it('una venta de la noche no se va al día siguiente', () => {
    const acotado = filtrarVentas(filas, {
      ...SIN_FILTROS,
      desde: '2026-09-22',
      hasta: '2026-09-22',
    });

    expect(ids(acotado)).toEqual(['c']);
    expect(ids(acotado)).not.toContain('b');
  });

  it('la fecha se cruza con los demás filtros', () => {
    const acotado = filtrarVentas(filas, {
      estado: ['activas'],
      estados: ['ev-pagada'],
      desde: '2026-09-21',
      hasta: '2026-09-30',
    });

    expect(ids(acotado)).toEqual(['b']);
  });

  it('no muta la lista que recibe', () => {
    const copia = [...filas];
    filtrarVentas(filas, { ...SIN_FILTROS, estado: ['baja'] });
    expect(filas).toEqual(copia);
  });
});

describe('totalDeLoMostrado', () => {
  it('suma lo que se está viendo', () => {
    expect(totalDeLoMostrado([filas[0]!, filas[1]!])).toBe(80);
  });

  it('una venta dada de baja no suma: no es dinero que entró', () => {
    expect(totalDeLoMostrado(filas)).toBe(80);
  });

  it('sin filas es cero, no NaN', () => {
    expect(totalDeLoMostrado([])).toBe(0);
  });
});
