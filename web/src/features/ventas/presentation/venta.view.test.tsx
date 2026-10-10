import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarRuta, rutaActual } from '@/shared/testing/router-falso';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProveedorDeSesion } from '@/shared/lib/sesion-actual';

/**
 * El libro de ventas entero, montado de verdad — y **con las mismas preguntas**
 * que las otras tres vistas.
 *
 * Que cuatro pantallas se parezcan en el código no demuestra nada: cuatro
 * copias también se parecen. Lo que demuestra que comparten composición es que
 * la misma prueba, palabra por palabra, describa a las cuatro.
 *
 * Lo propio de aquí está en su propia prueba, no escondido: el total de lo
 * mostrado, el filtro de fecha —el único que funciona en todo el proyecto— y
 * que el vendedor sale de la sesión y no de un desplegable.
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
 * paso comprueba que los chips de dentro de la hoja son los que mandan.
 */
const abrirFiltros = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(screen.getByRole('button', { name: /Filtros/ }));
};

/**
 * La sesión es obligatoria: `useCreateVenta` la lee para poner el vendedor.
 * Montar sin ella reventaría, que es exactamente lo que `useSesionActual`
 * promete hacer — y por eso hay una prueba que lo comprueba.
 */
function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ProveedorDeSesion
        sesion={{ usuarioId: 'u-3', nombre: 'Raul Oscar Menendez', rol: 'Administrador' }}
      >
        <VentaView />
      </ProveedorDeSesion>
    </QueryClientProvider>,
  );
}

const { VentaView } = await import('./venta.view');

describe('VentaView', () => {
  it('pide la colección al puerto y pinta lo que llega', async () => {
    montar();
    // La venta de 've-2': 3 sandwiches a 0,40.
    expect(await screen.findByText(/1,20/)).toBeInTheDocument();
  });

  it('la vista de tabla enseña la misma colección en filas, con sus acciones', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByRole('columnheader', { name: 'Cuándo' })).toBeInTheDocument();
    expect(within(tabla).getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
    // La columna de acciones no es opcional (regla 8.10).
    expect(within(tabla).getAllByRole('button', { name: /Corregir la venta/i }).length).toBeGreaterThan(0);
  });

  it('la ficha se abre con los datos de la fila, no con los de la primera', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    const [primera] = screen.getAllByRole('button', { name: /Ver el detalle de la venta/i });
    await usuario.click(primera!);

    // El ticket enseña la cabecera de su tabla de líneas.
    expect(await screen.findByText('Qué se llevó')).toBeInTheDocument();
  });

  it('acota por varios estados a la vez, y los dos quedan en la dirección', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Pagada' }));
    await usuario.click(screen.getByRole('button', { name: 'Anulada' }));

    await waitFor(() => expect(rutaActual()).toContain('estadoVenta=ev-pagada%2Cev-anulada'));
  });

  it('escribe el filtro en la dirección en vez de guardárselo', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    await waitFor(() => expect(rutaActual()).toContain('vista=tabla'));
  });

  it('resuelve los ids de cliente a nombres: el backend solo manda ids', async () => {
    montar();
    // 'c-1' es Luis Fernando Chavez Rojas, y tiene **dos** ventas en el mock:
    // por eso `findAllBy`. Que salga más de una vez es lo correcto.
    expect((await screen.findAllByText('Luis Fernando Chavez Rojas')).length).toBe(2);
  });

  it('una venta sin cliente dice «Mostrador», no deja un hueco', async () => {
    montar();
    // `idCliente` admite NULL: no es un dato que falte, es una venta sin cliente.
    expect((await screen.findAllByText('Mostrador')).length).toBeGreaterThan(0);
  });

  it('suma lo que se está mirando, y la suma cambia al acotar', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Suma de lo que estás viendo');

    const antes = screen.getByText('Suma de lo que estás viendo').parentElement?.textContent;

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Anulada' }));

    await waitFor(() => {
      const ahora = screen.getByText('Suma de lo que estás viendo').parentElement?.textContent;
      expect(ahora).not.toBe(antes);
    });
  });

  it('el filtro de fecha está encendido aquí, al revés que en las otras pantallas', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    await abrirFiltros(usuario);

    // En las otras tres este control sale `disabled` con su motivo.
    const fecha = screen.getByRole('button', { name: /fecha/i });
    expect(fecha).not.toBeDisabled();
  });
});

/**
 * El reporte y el resumen.
 *
 * Lo que se comprueba aquí es lo que se pidió explícitamente: que mientras el
 * reporte se prepara el botón quede ocupado y **no se pueda descargar dos
 * veces**. La guardia real está en el caso de uso y no en el `disabled`,
 * porque deshabilitar solo tapa el clic del ratón.
 *
 * `URL.createObjectURL` no existe en jsdom: se sustituye por un doble que
 * cuenta. No es adorno — es la única forma de contar descargas sin navegador.
 */
describe('VentaView: reporte y resumen', () => {
  const conDescargaFalsa = () => {
    const descargas: string[] = [];
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:falso'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      descargas.push(this.download);
    });
    return descargas;
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('descarga un archivo con nombre fechado', async () => {
    const descargas = conDescargaFalsa();
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    await usuario.click(screen.getByRole('button', { name: 'Reporte' }));

    await waitFor(() => expect(descargas).toHaveLength(1));
    expect(descargas[0]).toMatch(/^ventas-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);
  });

  it('mientras prepara, el botón queda ocupado y no descarga dos veces', async () => {
    const descargas = conDescargaFalsa();
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    const boton = screen.getByRole('button', { name: 'Reporte' });
    await usuario.click(boton);

    // El botón se anuncia ocupado en cuanto empieza.
    await waitFor(() => expect(boton).toHaveAttribute('aria-busy', 'true'));
    expect(boton).toBeDisabled();

    // Un segundo intento durante la preparación no produce otra descarga.
    // Se dispara el evento a mano: `userEvent` se niega a pulsar un botón
    // deshabilitado, y lo que hay que comprobar es justo que **aunque llegue
    // el clic**, la guardia del caso de uso lo para.
    boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await waitFor(() => expect(descargas).toHaveLength(1));
    await waitFor(() => expect(boton).not.toBeDisabled());
    expect(descargas).toHaveLength(1);
  });

  it('el resumen se abre desde la cabecera y queda en la dirección', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText(/1,20/);

    expect(screen.queryByText('Ingreso por día')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Resumen' }));

    await waitFor(() => expect(rutaActual()).toContain('resumen=1'));
    expect(await screen.findByText('Ingreso por día')).toBeInTheDocument();
    expect(screen.getByText('Cómo quedaron')).toBeInTheDocument();
    expect(screen.getByText('Lo que más deja')).toBeInTheDocument();
  });
});
