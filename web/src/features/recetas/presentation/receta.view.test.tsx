import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarRuta, rutaActual } from '@/shared/testing/router-falso';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * El recetario entero, montado de verdad — y **con las mismas preguntas** que
 * `producto.view.test.tsx` y `personal.view.test.tsx`.
 *
 * Que tres pantallas se parezcan en el código no demuestra nada: tres copias
 * también se parecen. Lo que demuestra que comparten composición es que la
 * misma prueba, palabra por palabra, describa a las tres.
 *
 * Lo propio de aquí está en su propia prueba, no escondido: una receta
 * referencia productos por id, así que hay que comprobar que los nombres se
 * resuelven y que lo que se enseña son nombres y no UUID.
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

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <RecetaView />
    </QueryClientProvider>,
  );
}

const { RecetaView } = await import('./receta.view');

describe('RecetaView', () => {
  it('pide la colección al puerto y pinta lo que llega', async () => {
    montar();
    expect(await screen.findByText('Frapuccino de la casa')).toBeInTheDocument();
  });

  it('la vista de tabla enseña la misma colección en filas, con sus acciones', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Frapuccino de la casa');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByRole('columnheader', { name: 'Receta' })).toBeInTheDocument();
    expect(within(tabla).getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
    // La columna de acciones no es opcional: sin ella hay que cambiar de vista
    // para editar, que es justo lo que esta vista evita (regla 8.10).
    expect(
      within(tabla).getByRole('button', { name: /Editar Frapuccino de la casa/i }),
    ).toBeInTheDocument();
  });

  it('la ficha se abre con los datos de la fila, no con los de la primera', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Sandwich mixto');

    await usuario.click(screen.getByRole('button', { name: /Ver la receta de Sandwich mixto/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Sandwich mixto').length).toBeGreaterThan(1);
    });
  });

  it('acota por varios productos a la vez, y los dos quedan en la dirección', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Frapuccino de la casa');

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Frapuccino' }));
    await usuario.click(screen.getByRole('button', { name: 'Fralatte' }));

    await waitFor(() => expect(rutaActual()).toContain('producto=pr-11%2Cpr-12'));
  });

  it('escribe el filtro en la dirección en vez de guardárselo', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Frapuccino de la casa');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    await waitFor(() => expect(rutaActual()).toContain('vista=tabla'));
  });

  it('resuelve los ids de producto a nombres: el backend solo manda ids', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Frapuccino de la casa');

    await usuario.click(
      screen.getByRole('button', { name: /Ver la receta de Frapuccino de la casa/i }),
    );

    // «pr-17» es Café molido. Si la ficha enseñara el id, esto lo diría.
    expect(await screen.findByText('Café molido')).toBeInTheDocument();
    expect(screen.queryByText('pr-17')).not.toBeInTheDocument();
  });

  it('la ficha enseña los pasos en orden, no en el orden en que llegaron', async () => {
    const usuario = userEvent.setup();
    montar();
    // `findAllByText`: «Fralatte» es a la vez el título de la receta y el
    // nombre del producto que produce. Son dos nodos de verdad.
    await screen.findAllByText('Fralatte');

    await usuario.click(screen.getByRole('button', { name: /Ver la receta de Fralatte/i }));

    const pasos = await screen.findAllByRole('listitem');
    const textos = pasos.map((paso) => paso.textContent ?? '');
    const moler = textos.findIndex((texto) => texto.includes('Moler'));
    const servir = textos.findIndex((texto) => texto.includes('Verter y servir'));

    expect(moler).toBeGreaterThanOrEqual(0);
    expect(moler).toBeLessThan(servir);
  });
});
