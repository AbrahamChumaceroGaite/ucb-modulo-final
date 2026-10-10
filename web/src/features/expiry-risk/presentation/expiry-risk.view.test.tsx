import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createQueryClient } from '@/shared/api/query-client';
import type { LotRisk } from '../domain/lot-risk.schema';
import { cookiesLot, milkLot, modelCard, pageOf, tomatoLot } from '../testing/fixtures';
import { EXPIRY_RISK_TOUR } from './expiry-risk.tour';
import { ExpiryRiskView } from './expiry-risk.view';

/**
 * The whole screen with `fetch` as the only double: hooks, schemas, the
 * HTTP client and every component are the real ones.
 */
type Reply = [status: number, body: unknown] | Error;
type Handler = (url: string, body: unknown) => Reply | undefined;

const fetchMock = vi.fn<typeof fetch>();

function serve(override: Handler = () => undefined) {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const reply = override(url, body) ?? defaultReply(url);
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply[1]), { status: reply[0], headers: { 'Content-Type': 'application/json' } });
  });
}

function defaultReply(url: string): Reply {
  if (url.startsWith('/api/proxy/risk-model')) return [200, modelCard];
  if (url.startsWith('/api/proxy/lot-risk?')) return [200, pageOf([cookiesLot, tomatoLot, milkLot])];
  return [404, { status: 404, error: 'NotFound', message: 'No existe.', timestamp: '' }];
}

function requests(method: string, path: string) {
  return fetchMock.mock.calls.filter(([url, init]) => String(url).startsWith(path) && (init?.method ?? 'GET') === method);
}

function renderView() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ExpiryRiskView />
    </QueryClientProvider>,
  );
}

async function card(name: string) {
  const heading = await screen.findByRole('heading', { name, level: 3 });
  const article = heading.closest('article');
  if (!article) throw new Error(`No card for ${name}`);
  return within(article);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

describe('ExpiryRiskView', () => {
  it('lists the open lots with the model decision and the rule leftover', async () => {
    serve();
    renderView();

    const cookies = await card('Galletas de mantequilla');
    expect(cookies.getByText('Usar primero')).toBeInTheDocument();
    expect(cookies.getByRole('meter', { name: 'Riesgo de vencer' })).toHaveAttribute('aria-valuenow', '70');
    expect(cookies.getByText('Unos 8 und')).toBeInTheDocument();
    expect(screen.getByText(/Mañana del 4 oct 2026/)).toBeInTheDocument();
  });

  it('shows the hard case where the model warns and the rule does not', async () => {
    serve();
    renderView();

    const tomato = await card('Tomate 1 kg');
    expect(tomato.getByText('Usar primero')).toBeInTheDocument();
    expect(tomato.getByText('La regla no avisa.')).toBeInTheDocument();
  });

  it('asks the API again when a risk level is chosen', async () => {
    serve();
    renderView();
    await card('Galletas de mantequilla');

    const levels = screen.getByRole('group', { name: 'Nivel de riesgo' });
    await userEvent.click(within(levels).getByRole('button', { name: 'Usar primero' }));

    await waitFor(() => expect(requests('GET', '/api/proxy/lot-risk?skip=0&limit=10&level=high')).toHaveLength(1));
    expect(within(levels).getByRole('button', { name: 'Usar primero' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('copies a lot into the form, changes it and shows what the model answers', async () => {
    let sent: unknown;
    const answer: LotRisk = { ...tomatoLot, lotId: null, remainingQuantity: 900, initialQuantity: 1000, probability: 0.82, estimatedLeftover: 500 };
    serve((url, body) => {
      if (url !== '/api/proxy/lot-risk/evaluate') return undefined;
      sent = body;
      return [200, answer];
    });
    renderView();

    const tomato = await card('Tomate 1 kg');
    await userEvent.click(tomato.getByRole('button', { name: 'Probar cambios' }));

    const remaining = await screen.findByLabelText('Queda (g)');
    expect(remaining).toHaveValue('400');
    await userEvent.clear(remaining);
    await userEvent.type(remaining, '900');
    await userEvent.click(screen.getByRole('button', { name: 'Evaluar lote' }));

    const result = within(await screen.findByRole('region', { name: 'Resultado de la evaluación' }));
    expect(result.getByRole('meter')).toHaveAttribute('aria-valuenow', '82');
    expect(result.getByText('Unos 500 g')).toBeInTheDocument();
    expect(sent).toMatchObject({ productId: tomatoLot.product.id, remainingQuantity: 900, usage28d: 187.5 });
  });

  it('marks the invalid fields and does not call the model', async () => {
    serve();
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: 'Evaluar lote' }));
    await userEvent.type(screen.getByLabelText('Uso diario, 7 días'), 'mucho');
    await userEvent.click(screen.getByRole('button', { name: 'Evaluar lote' }));

    expect(await screen.findByText('Elige un producto.')).toBeInTheDocument();
    expect(screen.getByLabelText('Uso diario, 7 días')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Escribe un número.')).toBeInTheDocument();
    expect(requests('POST', '/api/proxy/lot-risk/evaluate')).toHaveLength(0);
  });

  it('hides an earlier answer once the form holds an invalid entry', async () => {
    serve((url) => (url === '/api/proxy/lot-risk/evaluate' ? [200, cookiesLot] : undefined));
    renderView();

    await userEvent.click((await card('Galletas de mantequilla')).getByRole('button', { name: 'Probar cambios' }));
    await userEvent.click(screen.getByRole('button', { name: 'Evaluar lote' }));
    await screen.findByRole('region', { name: 'Resultado de la evaluación' });

    await userEvent.clear(screen.getByLabelText('Queda (und)'));
    await userEvent.click(screen.getByRole('button', { name: 'Evaluar lote' }));

    expect(await screen.findByText('Escribe cuánto queda.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resultado de la evaluación' })).not.toBeInTheDocument();
  });

  it('shows the reason the API gives when it rejects a lot', async () => {
    serve((url) =>
      url === '/api/proxy/lot-risk/evaluate'
        ? [422, { status: 422, error: 'BusinessRule', message: 'No puede quedar más de lo que tenía el lote.', timestamp: '' }]
        : undefined,
    );
    renderView();

    await userEvent.click((await card('Galletas de mantequilla')).getByRole('button', { name: 'Probar cambios' }));
    await userEvent.click(screen.getByRole('button', { name: 'Evaluar lote' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudo evaluar');
    expect(alert).toHaveTextContent('No puede quedar más de lo que tenía el lote.');
  });

  it('offers a retry when the list cannot load', async () => {
    let failures = 1;
    serve((url) => (url.startsWith('/api/proxy/lot-risk?') && failures-- > 0 ? new TypeError('Failed to fetch') : undefined));
    renderView();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No hay conexión con el servidor.');
    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }));

    expect(await card('Galletas de mantequilla')).toBeTruthy();
  });

  it('sends the person to sign in again when the session ended', async () => {
    serve((url) =>
      url.startsWith('/api/proxy/lot-risk?')
        ? [401, { status: 401, error: 'Unauthorized', message: 'Tu sesión terminó. Vuelve a entrar.', timestamp: '' }]
        : undefined,
    );
    renderView();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('link', { name: 'Volver a entrar' })).toHaveAttribute('href', '/');
  });

  it('shows the comparison with the baseline and the limits', async () => {
    serve();
    renderView();

    const table = await screen.findByRole('table');
    // Rule then model, recall first: 66 % against 87 %.
    const main = within(table).getByRole('row', { name: /Recall/ });
    expect(main).toHaveTextContent(/66\s?%/);
    expect(main).toHaveTextContent(/87\s?%/);
    expect(within(table).getByRole('row', { name: /Accuracy/ })).toHaveTextContent(/90\s?%/);
    expect(screen.getByText(/53 de cada 100 avisos son falsas alarmas/)).toBeInTheDocument();
  });

  it('has on screen every element the guided tour points at', async () => {
    serve();
    renderView();
    await card('Galletas de mantequilla');
    await screen.findByRole('table');

    const missing = EXPIRY_RISK_TOUR.flatMap(({ element }) =>
      typeof element === 'string' && !document.querySelector(element) ? [element] : [],
    );
    expect(missing).toEqual([]);
    expect(screen.getByRole('button', { name: 'Cómo funciona' })).toBeEnabled();
  });
});
