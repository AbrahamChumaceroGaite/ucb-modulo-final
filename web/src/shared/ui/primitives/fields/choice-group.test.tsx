import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceGroup } from './choice-group';

/**
 * El argumento para hacerlo con fichas en vez de un `<select>` era que caben
 * la explicación y el teclado. Las dos cosas se comprueban usándolo.
 */
const ROLES = [
  { valor: 'admin', etiqueta: 'Administrador', detalle: 'Cuentas del equipo y precios.' },
  { valor: 'operador', etiqueta: 'Operador', detalle: 'Barra y despensa.' },
] as const;

describe('ChoiceGroup', () => {
  it('en modo único es un grupo de radios y enseña el porqué de cada opción', () => {
    render(
      <ChoiceGroup
        etiquetaGrupo="Rol de la cuenta"
        opciones={ROLES}
        seleccion={['operador']}
        onCambiar={vi.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Rol de la cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Operador/ })).toBeChecked();
    expect(screen.getByText('Cuentas del equipo y precios.')).toBeInTheDocument();
  });

  it('elegir sustituye, no acumula', async () => {
    const usuario = userEvent.setup();
    const cambiar = vi.fn();

    render(
      <ChoiceGroup
        etiquetaGrupo="Rol de la cuenta"
        opciones={ROLES}
        seleccion={['operador']}
        onCambiar={cambiar}
      />,
    );

    await usuario.click(screen.getByRole('radio', { name: /Administrador/ }));
    expect(cambiar).toHaveBeenCalledWith(['admin']);
  });

  it('en modo múltiple son casillas y sí acumulan', async () => {
    const usuario = userEvent.setup();
    const cambiar = vi.fn();

    render(
      <ChoiceGroup
        multiple
        etiquetaGrupo="Permisos"
        opciones={ROLES}
        seleccion={['operador']}
        onCambiar={cambiar}
      />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    await usuario.click(screen.getByRole('checkbox', { name: /Administrador/ }));
    expect(cambiar).toHaveBeenCalledWith(['operador', 'admin']);
  });

  it('en modo múltiple, volver a pulsar quita', async () => {
    const usuario = userEvent.setup();
    const cambiar = vi.fn();

    render(
      <ChoiceGroup
        multiple
        etiquetaGrupo="Permisos"
        opciones={ROLES}
        seleccion={['operador', 'admin']}
        onCambiar={cambiar}
      />,
    );

    await usuario.click(screen.getByRole('checkbox', { name: /Operador/ }));
    expect(cambiar).toHaveBeenCalledWith(['admin']);
  });
});
