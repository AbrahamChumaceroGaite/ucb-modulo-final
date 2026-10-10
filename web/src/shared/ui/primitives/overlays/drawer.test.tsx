import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Drawer, DrawerPush } from './drawer';

/**
 * Estas pruebas existen por un defecto concreto, y lo fijan para que no
 * vuelva: `<DrawerPush>` montaba a la vez el panel lateral y la hoja de móvil,
 * y escondía una con `lg:hidden`. La hoja invisible seguía viva: bloqueaba el
 * desplazamiento de la página y se llevaba el foco a un botón que nadie veía.
 *
 * **Ocultar no es desmontar.** Se comprueba contando lo que hay en el DOM y
 * mirando `body.style.overflow`, no leyendo clases.
 */
function fingirAncho(coincide: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (consulta: string) =>
      ({
        matches: coincide,
        media: consulta,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

describe('DrawerPush', () => {
  it('con ancho de sobra no monta ninguna hoja modal', () => {
    fingirAncho(true);

    render(
      <DrawerPush abierto alCerrar={vi.fn()} titulo="House Espresso" panel={<p>Detalle</p>}>
        <p>Listado</p>
      </DrawerPush>,
    );

    expect(screen.getByText('Listado')).toBeInTheDocument();
    expect(screen.getByText('Detalle')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('con ancho de sobra NO bloquea el desplazamiento de la página', () => {
    fingirAncho(true);

    render(
      <DrawerPush abierto alCerrar={vi.fn()} titulo="House Espresso" panel={<p>Detalle</p>}>
        <p>Listado</p>
      </DrawerPush>,
    );

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('en estrecho sí es una hoja modal, que es lo que el espacio permite', () => {
    fingirAncho(false);

    render(
      <DrawerPush abierto alCerrar={vi.fn()} titulo="House Espresso" panel={<p>Detalle</p>}>
        <p>Listado</p>
      </DrawerPush>,
    );

    expect(screen.getByRole('dialog', { name: 'House Espresso' })).toBeInTheDocument();
  });
});

describe('Drawer', () => {
  it('cerrado no deja nada en el DOM ni toca el desplazamiento', () => {
    render(
      <Drawer abierto={false} alCerrar={vi.fn()} titulo="House Espresso">
        <p>Detalle</p>
      </Drawer>,
    );

    expect(screen.queryByText('Detalle')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('abierto sí cierra al pulsar el velo: este panel es para mirar, no para escribir', async () => {
    const usuario = (await import('@testing-library/user-event')).default.setup();
    const cerrar = vi.fn();

    render(
      <Drawer abierto alCerrar={cerrar} titulo="House Espresso">
        <p>Detalle</p>
      </Drawer>,
    );

    // Dos botones con ese nombre: el velo y la equis. El velo es el primero.
    const [velo] = screen.getAllByRole('button', { name: 'Cerrar' });
    await usuario.click(velo as HTMLElement);

    expect(cerrar).toHaveBeenCalled();
  });
});
