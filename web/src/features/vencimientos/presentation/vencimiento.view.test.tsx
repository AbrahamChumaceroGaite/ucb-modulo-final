import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarRuta, rutaActual } from '@/shared/testing/router-falso';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Evaluacion, ModeloRiesgo } from '../domain/evaluacion.schema';

/**
 * La pantalla de vencimientos, montada entera, con **la red como único doble**.
 *
 * Las otras pantallas se prueban contra su mock; esta no tiene mock (ver
 * `vencimiento.puertos.ts`), así que se sustituye `fetch` y nada más. Lo que
 * se ejercita es todo lo de verdad: el cliente HTTP, el BFF como prefijo, el
 * `schema.parse()` de cada respuesta, la caché, la vista y el formulario.
 *
 * Las respuestas son las del servicio real, copiadas de una ejecución de
 * `ml-api` con su inventario sembrado.
 *
 * ## Lo que NO demuestra
 *
 * Que el modelo acierte: eso lo prueban `ml-api` (paridad con Python) y el
 * informe. Aquí se prueba que la pantalla enseña lo que el servicio dice y
 * manda lo que la persona escribió.
 */
vi.mock('next/navigation', async () => {
  const { routerFalso, useSearchParamsFalso } = await import('@/shared/testing/router-falso');
  return { useRouter: () => routerFalso, useSearchParams: useSearchParamsFalso };
});

const FRUTILLA: Evaluacion = {
  id: '814cf54d-f295-4522-a97b-ef22f9707c0d',
  codigoInsumo: 'FRU-FRE',
  insumo: 'Frutilla',
  categoria: 'frutas',
  unidad: 'kg',
  fechaIngreso: '2026-10-02',
  fechaVencimiento: '2026-10-05',
  fechaRevision: '2026-10-03',
  cantidadInicial: 1.5,
  cantidadRestante: 1.379,
  stockPorDelante: 0,
  consumo7d: 0.4681,
  consumo28d: 0.5158,
  diasParaVencer: 2,
  probabilidad: 0.7435742443865775,
  umbral: 0.286006996275895,
  nivel: 'alto',
  enRiesgo: true,
  reglaDeCobertura: false,
  diasCobertura: 2.9459517197180087,
  sobranteEstimado: 0,
  versionModelo: '1.0.0',
  origen: 'inventario',
  registradaEl: '2026-10-03T04:18:43.918Z',
};

const HUEVO: Evaluacion = {
  ...FRUTILLA,
  id: '878d11da-fe43-4abf-8606-c171ec3a086b',
  codigoInsumo: 'HUE-GAL',
  insumo: 'Huevo de gallina',
  categoria: 'huevos',
  unidad: 'u',
  fechaIngreso: '2026-09-29',
  fechaVencimiento: '2026-10-20',
  cantidadInicial: 90,
  cantidadRestante: 61,
  diasParaVencer: 17,
  probabilidad: 0.0029,
  nivel: 'bajo',
  enRiesgo: false,
  reglaDeCobertura: false,
  diasCobertura: 4.6,
  sobranteEstimado: 0,
};

const metricas = { recall: 0.9223, precision: 0.7706, accuracy: 0.9518, f1: 0.8396, avisoAnticipado2Dias: 0.9143 };

const MODELO: ModeloRiesgo = {
  version: '1.0.0',
  entrenadoEl: '2026-10-03T04:14:00+00:00',
  umbral: 0.286006996275895,
  recallObjetivo: 0.85,
  calendario: { anioMinimo: 2025, anioMaximo: 2027 },
  insumos: [
    { codigo: 'FRU-FRE', nombre: 'Frutilla', categoria: 'frutas', unidad: 'kg', vidaUtilDias: 4 },
    { codigo: 'HUE-GAL', nombre: 'Huevo de gallina', categoria: 'huevos', unidad: 'u', vidaUtilDias: 21 },
  ],
  metricas: { modelo: metricas, regla: { ...metricas, recall: 0.8187, accuracy: 0.944, avisoAnticipado2Dias: 0.7714 } },
};

type Llamada = { metodo: string; url: string; cuerpo: unknown };
let llamadas: Llamada[] = [];
let servicioCaido = false;

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });

/** El servicio, tal como responde a través del BFF. */
function servicio(entrada: string, init?: RequestInit): Promise<Response> {
  const metodo = init?.method ?? 'GET';
  const cuerpo = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  llamadas.push({ metodo, url: entrada, cuerpo });

  if (servicioCaido) {
    return Promise.resolve(
      json(
        {
          codigo: 502,
          tipo: 'SinConexion',
          mensaje: 'No se pudo contactar con el servicio de predicción. ¿Está levantado ml-api?',
          timestamp: '2026-10-03T04:20:00Z',
        },
        502,
      ),
    );
  }
  if (entrada.startsWith('/api/proxy/modelo-riesgo')) return Promise.resolve(json(MODELO));
  if (metodo === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }));
  if (metodo === 'POST') {
    return Promise.resolve(json({ ...FRUTILLA, id: '5e4d9d45-1ff9-47c2-8e64-2ad1988906f0', origen: 'manual', ...cuerpo }, 201));
  }
  const filas = entrada.includes('riesgo=alto') ? [FRUTILLA] : [FRUTILLA, HUEVO];
  return Promise.resolve(json({ data: filas, skip: 0, limit: 10, total: filas.length, hasMore: false }));
}

beforeEach(() => {
  reiniciarRuta();
  llamadas = [];
  servicioCaido = false;
  vi.stubGlobal('fetch', vi.fn(servicio));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const abrirFiltros = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(screen.getByRole('button', { name: /Filtros/ }));
};

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <VencimientoView />
    </QueryClientProvider>,
  );
}

const { VencimientoView } = await import('./vencimiento.view');

describe('VencimientoView', () => {
  it('pinta lo que devuelve el servicio, con la ficha del modelo al lado', async () => {
    montar();
    expect(await screen.findByText('Frutilla')).toBeInTheDocument();
    expect(screen.getByText('Huevo de gallina')).toBeInTheDocument();
    // Recall de prueba del modelo frente al de la regla, sobre los mismos lotes.
    expect(await screen.findByText('92%')).toBeInTheDocument();
    expect(screen.getByText(/La regla simple: 82%/)).toBeInTheDocument();
  });

  it('marca dónde el modelo y la regla no coinciden', async () => {
    montar();
    await screen.findByText('Frutilla');
    // La frutilla: la regla no avisa y el modelo sí. El huevo: coinciden.
    expect(screen.getAllByText(/no coinciden|no avisa y el modelo sí/)).toHaveLength(1);
  });

  it('el filtro de riesgo viaja al servidor y queda en la dirección', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Huevo de gallina');

    await abrirFiltros(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Usar primero' }));

    await waitFor(() => expect(rutaActual()).toContain('riesgo=alto'));
    await waitFor(() => expect(screen.queryByText('Huevo de gallina')).not.toBeInTheDocument());
    expect(llamadas.some((l) => l.url.startsWith('/api/proxy/evaluacion-lote?') && l.url.includes('riesgo=alto'))).toBe(true);
  });

  it('la tabla enseña lo mismo que la tarjeta: riesgo, regla y acciones', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Frutilla');

    await usuario.click(screen.getByRole('radio', { name: /tabla/i }));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByRole('columnheader', { name: 'Regla simple' })).toBeInTheDocument();
    expect(within(tabla).getByRole('button', { name: /Revisar de nuevo Frutilla/i })).toBeInTheDocument();
  });

  it('si el servicio está caído lo dice, y no enseña ni un número inventado', async () => {
    servicioCaido = true;
    montar();

    expect(await screen.findByText('No pudimos traer las evaluaciones')).toBeInTheDocument();
    expect(screen.getAllByText(/servicio de predicción/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('revisar de nuevo: mismo lote, revisión de hoy, y al terminar abre la respuesta', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 4, 9, 30));
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Frutilla');

    await usuario.click(screen.getByRole('button', { name: /Revisar de nuevo Frutilla/i }));
    const dialogo = await screen.findByRole('dialog');

    for (let paso = 0; paso < 3; paso += 1) {
      await usuario.click(within(dialogo).getByRole('button', { name: /Siguiente/ }));
    }
    await usuario.click(await within(dialogo).findByRole('button', { name: 'Evaluar con el modelo' }));

    await waitFor(() => expect(llamadas.some((l) => l.metodo === 'POST')).toBe(true));
    const enviado = llamadas.find((l) => l.metodo === 'POST');
    expect(enviado?.url).toBe('/api/proxy/evaluacion-lote');
    expect(enviado?.cuerpo).toMatchObject({
      codigoInsumo: 'FRU-FRE',
      fechaIngreso: '2026-10-02',
      fechaVencimiento: '2026-10-05',
      fechaRevision: '2026-10-04',
      consumo28d: 0.5158,
    });

    // La ficha del resultado se abre sola: es lo que la persona vino a saber.
    expect(await screen.findByText(/El modelo cree que este lote puede vencer con saldo/)).toBeInTheDocument();
  });

  it('quitar pide confirmación y manda el DELETE de esa evaluación', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText('Huevo de gallina');

    await usuario.click(screen.getByRole('button', { name: /Quitar de la lista Huevo de gallina/i }));
    expect(llamadas.some((l) => l.metodo === 'DELETE')).toBe(false);

    await usuario.click(await screen.findByRole('button', { name: 'Quitar' }));

    await waitFor(() =>
      expect(llamadas).toContainEqual({ metodo: 'DELETE', url: `/api/proxy/evaluacion-lote/${HUEVO.id}`, cuerpo: undefined }),
    );
  });
});
