import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarRuta, rutaActual } from '@/shared/testing/router-falso';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * La pantalla entera, montada de verdad.
 *
 * ## Por qué esta prueba existe
 *
 * Las demás comprueban piezas: que el umbral de stock es el que es, que el
 * asistente no se envía solo, que la hoja de filtros no se monta en ancho.
 * Ninguna comprueba **el flujo**: que la vista pide la colección al puerto,
 * que lo que llega se pinta, que cambiar de vista enseña la misma colección en
 * filas, que el filtro acota y que la ficha abre con los datos de la fila.
 *
 * Eso se estaba comprobando a mano en el navegador, y a mano no queda nada
 * escrito. Esta prueba corre contra `productoApiMock` —el mismo puerto que usa
 * la aplicación con `USAR_MOCKS`—, así que lo que valida es la composición
 * real de la pantalla, no un doble hecho para la ocasión.
 *
 * ## Lo que NO demuestra
 *
 * Que se vea bien. jsdom no tiene diseño: no hay anchos, ni `matchMedia` real,
 * ni el `hidden md:table-cell` de las columnas. La geometría se mide en el
 * navegador; esto mide el comportamiento.
 */
vi.mock('next/navigation', async () => {
  const { routerFalso, useSearchParamsFalso } = await import('@/shared/testing/router-falso');
  return { useRouter: () => routerFalso, useSearchParams: useSearchParamsFalso };
});

beforeEach(() => reiniciarRuta());

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ProductoView />
    </QueryClientProvider>,
  );
}


/**
 * En jsdom `matchMedia` siempre contesta que no, así que `<FilterBar>` monta
 * su rama estrecha: los chips viven dentro de la hoja de filtros. Por eso
 * estas pruebas la abren primero. No es un rodeo — es el flujo del móvil, y de
 * paso comprueba que los chips de dentro de la hoja son los que mandan y no
 * una copia decorativa.
 */
const abrirFiltros = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(screen.getByRole('button', { name: /Filtros/ }));
};

const { ProductoView } = await import('./producto.view');

describe('ProductoView', () => {
  it('pide la colección al puerto y pinta lo que llega', async () => {
    montar();

    // «Kaffe en grano» es la primera fila del Excel de poblado. Si el mock
    // dejara de ser el del Excel, esta prueba lo dice.
    expect(await screen.findByText('Kaffe en grano')).toBeInTheDocument();
  });

  it('la vista de tabla enseña la misma colección en filas, con sus acciones', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Kaffe en grano');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByRole('columnheader', { name: 'Producto' })).toBeInTheDocument();
    expect(within(tabla).getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
    expect(within(tabla).getByText('Kaffe en grano')).toBeInTheDocument();

    // La columna de acciones no es opcional: sin ella hay que cambiar de vista
    // para editar, que es justo lo que esta vista evita (regla 8.10).
    expect(
      within(tabla).getByRole('button', { name: /Editar Kaffe en grano/i }),
    ).toBeInTheDocument();
  });

  it('la ficha se abre con los datos de la fila, no con los de la primera', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Kaffe Molido');

    await usuario.click(screen.getByRole('button', { name: /Ver la ficha de Kaffe Molido/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Kaffe Molido').length).toBeGreaterThan(1);
    });
  });

  it('acota por varias categorías a la vez, y las dos quedan en la dirección', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Kaffe en grano');

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Cafes' }));
    await usuario.click(screen.getByRole('button', { name: 'Masas' }));

    await waitFor(() => expect(rutaActual()).toContain('categoria=cat-cafes%2Ccat-masas'));

    // Unión, no intersección: siguen estando los cafés Y las masas.
    expect(await screen.findByText('Kaffe en grano')).toBeInTheDocument();
    expect(screen.getByText('Galletas')).toBeInTheDocument();
    // Y lo de fuera de las dos ya no está.
    expect(screen.queryByText('Agua Sin Gas')).not.toBeInTheDocument();
  });

  it('«Todas» limpia el grupo en vez de añadirse a él', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Kaffe en grano');

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Cafes' }));
    await waitFor(() => expect(rutaActual()).toContain('categoria=cat-cafes'));

    await usuario.click(screen.getByRole('button', { name: 'Todas' }));
    await waitFor(() => expect(rutaActual()).not.toContain('categoria'));
  });

  it('escribe el filtro en la dirección en vez de guardárselo', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Kaffe en grano');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    // Lo que se mira vive en la URL: la lista tiene que poder compartirse.
    await waitFor(() => expect(rutaActual()).toContain('vista=tabla'));
  });
});
