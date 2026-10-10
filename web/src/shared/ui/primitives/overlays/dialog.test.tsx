import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './dialog';

/**
 * «El diálogo no se cierra al pulsar fuera» es una regla (§8.8) y una promesa:
 * dentro hay formularios y un clic desviado tiraría lo escrito. Una promesa de
 * comportamiento se comprueba comportándose, no leyendo el JSX.
 */
describe('Dialog', () => {
  it('NO se cierra al pulsar fuera', async () => {
    const usuario = userEvent.setup();
    const cerrar = vi.fn();

    render(
      <Dialog abierto alCerrar={cerrar} titulo="Registrar una entrada">
        <p>Contenido</p>
      </Dialog>,
    );

    // El velo es el primer hijo del contenedor fijo y cubre la pantalla.
    const velo = document.querySelector('[aria-hidden="true"]');
    expect(velo).not.toBeNull();
    await usuario.click(velo as Element);

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('el velo no es pulsable ni tabulable: no hay un «Cerrar» invisible', () => {
    render(
      <Dialog abierto alCerrar={vi.fn()} titulo="Registrar una entrada">
        <p>Contenido</p>
      </Dialog>,
    );

    // Un único botón visible: la equis de la cabecera.
    expect(screen.getAllByRole('button', { name: 'Cerrar' })).toHaveLength(1);
  });

  it('sí se cierra con Escape', async () => {
    const usuario = userEvent.setup();
    const cerrar = vi.fn();

    render(
      <Dialog abierto alCerrar={cerrar} titulo="Registrar una entrada">
        <p>Contenido</p>
      </Dialog>,
    );

    await usuario.keyboard('{Escape}');
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('sí se cierra con la equis', async () => {
    const usuario = userEvent.setup();
    const cerrar = vi.fn();

    render(
      <Dialog abierto alCerrar={cerrar} titulo="Registrar una entrada">
        <p>Contenido</p>
      </Dialog>,
    );

    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('cerrado no deja nada en el DOM', () => {
    render(
      <Dialog abierto={false} alCerrar={vi.fn()} titulo="Registrar una entrada">
        <p>Contenido</p>
      </Dialog>,
    );

    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });
});
