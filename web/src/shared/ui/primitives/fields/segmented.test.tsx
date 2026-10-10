import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './segmented';

/**
 * El argumento para hacerlo con radios de verdad en vez de botones era que así
 * se navega con las flechas y el grupo se anuncia entero. Eso hay que
 * demostrarlo: en la librería que auditamos el equivalente eran `div`s con
 * `onClick` y no había forma de cambiar de opción sin ratón.
 */
const OPCIONES = [
  { valor: 'administrador', etiqueta: 'Administrador' },
  { valor: 'operador', etiqueta: 'Operador' },
] as const;

describe('SegmentedControl', () => {
  it('se anuncia como grupo de radios con su nombre', () => {
    render(
      <SegmentedControl
        etiquetaGrupo="Con qué perfil entras"
        opciones={OPCIONES}
        valor="operador"
        onCambiar={vi.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Con qué perfil entras' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Operador' })).toBeChecked();
  });

  it('cambia con las flechas del teclado, sin tocar el ratón', async () => {
    const usuario = userEvent.setup();
    const cambiar = vi.fn();

    render(
      <SegmentedControl
        etiquetaGrupo="Con qué perfil entras"
        opciones={OPCIONES}
        valor="administrador"
        onCambiar={cambiar}
      />,
    );

    await usuario.tab();
    await usuario.keyboard('{ArrowRight}');

    expect(cambiar).toHaveBeenCalledWith('operador');
  });

  it('una opción de solo icono conserva su nombre accesible', () => {
    render(
      <SegmentedControl
        etiquetaGrupo="Cómo se ve el listado"
        opciones={[
          { valor: 'rejilla', etiqueta: '', titulo: 'Cuadrícula' },
          { valor: 'lista', etiqueta: '', titulo: 'Lista' },
        ]}
        valor="rejilla"
        onCambiar={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Cuadrícula' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Lista' })).toBeInTheDocument();
  });
});
