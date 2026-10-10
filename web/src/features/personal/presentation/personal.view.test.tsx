import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarRuta, rutaActual } from '@/shared/testing/router-falso';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * La pantalla de Personal, montada de verdad — y **con las mismas preguntas**
 * que `producto.view.test.tsx`.
 *
 * Que las dos pantallas se parezcan en el código no demuestra nada: dos copias
 * también se parecen. Lo que demuestra que comparten composición es que la
 * misma prueba, palabra por palabra, describa a las dos: pedir la colección al
 * puerto, pintarla, pasarla a filas con sus acciones, abrir la ficha de la
 * fila pulsada y dejar lo que se mira en la dirección.
 *
 * Lo que cambia entre las dos es solo el dominio: aquí hay pestañas de cuentas
 * y clientes, y allí no. Esa diferencia está en su prueba, no escondida.
 *
 * ## Lo que NO demuestra
 *
 * Que se vea bien: jsdom no tiene anchos ni `matchMedia` real, así que no sabe
 * nada de las columnas que se esconden al estrechar. Eso se mide en el
 * navegador.
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
      <PersonalView />
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

const { PersonalView } = await import('./personal.view');

describe('PersonalView', () => {
  it('pide la colección al puerto y pinta lo que llega', async () => {
    montar();
    // `findAllBy` y no `findBy`: la tarjeta pinta el nombre en el título y el
    // avatar lo repite. Son dos nodos de verdad, no un duplicado del listado.
    expect((await screen.findAllByText('Sebastian Carlos Oliveira Pacheco')).length)
      .toBeGreaterThan(0);
  });

  it('la vista de tabla enseña la misma colección en filas, con sus acciones', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findAllByText('Sebastian Carlos Oliveira Pacheco');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    expect(within(tabla).getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
    expect(
      within(tabla).getByRole('button', { name: /Editar a Sebastian Carlos Oliveira Pacheco/i }),
    ).toBeInTheDocument();
  });

  it('la ficha se abre con los datos de la fila, no con los de la primera', async () => {
    const usuario = userEvent.setup();
    montar();
    const antes = (await screen.findAllByText('Raul Oscar Menendez Urzagaste')).length;

    await usuario.click(
      screen.getByRole('button', { name: /Ver la ficha de Raul Oscar Menendez Urzagaste/i }),
    );

    // La ficha suma nodos con ESE nombre, no con el de la primera fila.
    await waitFor(() => {
      expect(screen.getAllByText('Raul Oscar Menendez Urzagaste').length).toBeGreaterThan(antes);
    });
    expect(screen.queryAllByText('Sebastian Carlos Oliveira Pacheco').length).toBe(2);
  });

  it('escribe el filtro en la dirección en vez de guardárselo', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findAllByText('Sebastian Carlos Oliveira Pacheco');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    await waitFor(() => expect(rutaActual()).toContain('vista=tabla'));
  });

  it('acota por varios roles a la vez, y los dos quedan en la dirección', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findAllByText('Sebastian Carlos Oliveira Pacheco');

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Operador' }));
    await usuario.click(screen.getByRole('button', { name: 'Administrador' }));

    await waitFor(() => {
      const ruta = rutaActual();
      expect(ruta).toContain('rol=');
      expect(decodeURIComponent(ruta).split('rol=')[1]?.split('&')[0]?.split(',')).toHaveLength(2);
    });
  });

  it('cambiar de pestaña cambia de colección, y eso también vive en la URL', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findAllByText('Sebastian Carlos Oliveira Pacheco');

    await usuario.click(screen.getByRole('radio', { name: 'Clientes' }));

    await waitFor(() => expect(rutaActual()).toContain('tipo=clientes'));
    // La columna de correo es de las cuentas: un cliente no tiene.
    expect(screen.queryByText('sebastian@kaffehaus.bo')).not.toBeInTheDocument();
  });
});
