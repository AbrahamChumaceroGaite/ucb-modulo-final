import { describe, expect, it } from 'vitest';
import { aParametrosDeApi } from './evaluacion.filtros';

const sinFiltros = { riesgo: [], categoria: [], desde: '', hasta: '' };

describe('aParametrosDeApi', () => {
  it('sin filtros solo viaja la paginación', () => {
    expect(aParametrosDeApi({ skip: 0, limit: 10 }, sinFiltros)).toEqual({ skip: 0, limit: 10 });
  });

  it('las listas viajan separadas por comas y las fechas con el nombre que espera la API', () => {
    expect(
      aParametrosDeApi(
        { skip: 10, limit: 10, search: 'leche' },
        { riesgo: ['alto', 'vigilar'], categoria: ['lacteos'], desde: '2026-10-01', hasta: '2026-10-09' },
      ),
    ).toEqual({
      skip: 10,
      limit: 10,
      search: 'leche',
      riesgo: 'alto,vigilar',
      categoria: 'lacteos',
      venceDesde: '2026-10-01',
      venceHasta: '2026-10-09',
    });
  });
});
