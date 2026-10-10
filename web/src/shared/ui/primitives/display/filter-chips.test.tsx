import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips } from './filter-chips';

/**
 * Los chips de filtro.
 *
 * Eran de selección única, y eso convertía «enséñame cafés y capuchinos» en
 * dos búsquedas seguidas. Estas pruebas fijan las dos decisiones del cambio:
 * que pulsar acumula en vez de sustituir, y que la opción vacía no es un valor
 * más sino el «todos» que limpia el grupo.
 *
 * ## Lo que NO se prueba aquí
 *
 * Que las flechas aparezcan. Dependen de `scrollWidth` contra `clientWidth`, y
 * en jsdom ambos valen cero porque no hay diseño: cualquier afirmación sobre
 * ellas estaría midiendo el simulador, no el producto. Se comprueban en el
 * navegador, y así consta en SPECS.
 */
const OPCIONES = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'cafes', etiqueta: 'Cafes' },
  { valor: 'masas', etiqueta: 'Masas' },
];

function pintar(valores: readonly string[]) {
  const onCambiar = vi.fn();
  render(
    <FilterChips
      opciones={OPCIONES}
      valores={valores}
      onCambiar={onCambiar}
      etiquetaGrupo="Filtrar por categoría"
    />,
  );
  return onCambiar;
}

describe('FilterChips', () => {
  it('se anuncia como un grupo con su nombre', () => {
    pintar([]);
    expect(screen.getByRole('group', { name: 'Filtrar por categoría' })).toBeInTheDocument();
  });

  it('pulsar un chip lo añade a lo que ya había, no lo sustituye', async () => {
    const usuario = userEvent.setup();
    const onCambiar = pintar(['cafes']);

    await usuario.click(screen.getByRole('button', { name: 'Masas' }));

    expect(onCambiar).toHaveBeenCalledWith(['cafes', 'masas']);
  });

  it('pulsar un chip que ya estaba lo quita', async () => {
    const usuario = userEvent.setup();
    const onCambiar = pintar(['cafes', 'masas']);

    await usuario.click(screen.getByRole('button', { name: 'Cafes' }));

    expect(onCambiar).toHaveBeenCalledWith(['masas']);
  });

  it('cada chip dice si está puesto, y varios pueden estarlo a la vez', () => {
    pintar(['cafes', 'masas']);

    expect(screen.getByRole('button', { name: 'Cafes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Masas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('«Todas» está activo justo cuando no hay nada elegido', () => {
    pintar([]);
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('«Todas» no se añade a la lista: la vacía', async () => {
    const usuario = userEvent.setup();
    const onCambiar = pintar(['cafes', 'masas']);

    await usuario.click(screen.getByRole('button', { name: 'Todas' }));

    expect(onCambiar).toHaveBeenCalledWith([]);
  });
});
