import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from './field';
import { Input } from './input';

/**
 * `soloDigitos` existe porque un carnet y un teléfono son **cadenas de
 * dígitos**, no cantidades: no se suman, no se ordenan y pueden empezar por
 * cero. La alternativa, `type="number"`, acepta `e`, `+` y `-`, trae
 * ruedecilla y en varios navegadores deja el campo vacío sin decir por qué.
 */
describe('Input con soloDigitos', () => {
  it('descarta las letras al teclear', async () => {
    const usuario = userEvent.setup();
    render(
      <Field etiqueta="Carnet">
        <Input soloDigitos />
      </Field>,
    );

    const campo = screen.getByLabelText('Carnet');
    await usuario.type(campo, 'a1b2c3');

    expect(campo).toHaveValue('123');
  });

  it('descarta también lo que se pega, que es por donde se cuela', async () => {
    const usuario = userEvent.setup();
    render(
      <Field etiqueta="Teléfono">
        <Input soloDigitos />
      </Field>,
    );

    const campo = screen.getByLabelText('Teléfono');
    await usuario.click(campo);
    await usuario.paste('672-535-82');

    expect(campo).toHaveValue('67253582');
  });

  it('avisa al formulario con el valor ya limpio, no con el original', async () => {
    const usuario = userEvent.setup();
    const alCambiar = vi.fn();

    render(
      <Field etiqueta="Carnet">
        <Input soloDigitos onChange={(evento) => alCambiar(evento.target.value)} />
      </Field>,
    );

    await usuario.type(screen.getByLabelText('Carnet'), 'x9');
    expect(alCambiar).toHaveBeenLastCalledWith('9');
  });

  it('se anuncia como numérico para que el móvil abra el teclado de cifras', () => {
    render(
      <Field etiqueta="Carnet">
        <Input soloDigitos />
      </Field>,
    );

    expect(screen.getByLabelText('Carnet')).toHaveAttribute('inputmode', 'numeric');
  });

  it('sin la prop, el campo acepta lo que sea', async () => {
    const usuario = userEvent.setup();
    render(
      <Field etiqueta="Nombre">
        <Input />
      </Field>,
    );

    await usuario.type(screen.getByLabelText('Nombre'), 'Luis 2');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Luis 2');
  });
});
