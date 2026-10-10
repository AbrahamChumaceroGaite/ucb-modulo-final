import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './filter-bar';

/**
 * Los filtros en estrecho — *regla 8.11*.
 *
 * Nace de un problema real: tres grupos de chips se apilaban en cinco líneas
 * y se comían la pantalla del móvil antes de enseñar un solo registro. La
 * solución tenía dos riesgos y los dos se comprueban aquí.
 *
 * El primero es **duplicar**: escribir una segunda versión de los filtros para
 * móvil que se separaría de la de escritorio a la primera corrección. Por eso
 * la prueba usa el mismo `children` y comprueba que es ese, y no otro, el que
 * aparece dentro de la hoja.
 *
 * El segundo es **montar las dos ramas y esconder una con CSS**, que fue
 * exactamente el defecto de `<DrawerPush>`: la hoja invisible seguía viva,
 * bloqueaba el desplazamiento de la página y se llevaba el foco. Por eso se
 * comprueba que en ancho no exista ningún diálogo.
 */
function conAncho(coincide: boolean) {
  window.matchMedia = ((consulta: string) =>
    ({
      matches: coincide,
      media: consulta,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}

afterEach(() => vi.restoreAllMocks());

const pintar = () =>
  render(
    <FilterBar
      aplicados={[{ clave: 'rol', etiqueta: 'Rol', valor: 'Operador', quitar: () => undefined }]}
      onLimpiar={() => undefined}
    >
      <button type="button">Chip de categoría</button>
    </FilterBar>,
  );

describe('FilterBar', () => {
  it('con ancho de sobra los filtros están en línea y no hay ninguna hoja montada', async () => {
    conAncho(true);
    pintar();

    expect(await screen.findByRole('button', { name: 'Chip de categoría' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filtros/ })).not.toBeInTheDocument();
    // La hoja escondida por CSS fue un defecto real: aquí ni siquiera existe.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('en estrecho los filtros se pliegan tras un botón que dice cuántos hay puestos', () => {
    conAncho(false);
    pintar();

    const boton = screen.getByRole('button', { name: /Filtros/ });
    expect(boton).toHaveTextContent('1');
    // Plegados, no montados en paralelo.
    expect(screen.queryByRole('button', { name: 'Chip de categoría' })).not.toBeInTheDocument();
  });

  it('la hoja enseña los mismos filtros, no una segunda versión', async () => {
    conAncho(false);
    const usuario = userEvent.setup();
    pintar();

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }));

    const hoja = await screen.findByRole('dialog');
    expect(within(hoja).getByRole('button', { name: 'Chip de categoría' })).toBeInTheDocument();
    expect(within(hoja).getByRole('button', { name: 'Ver resultados' })).toBeInTheDocument();
  });
});
