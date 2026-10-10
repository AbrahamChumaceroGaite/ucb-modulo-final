import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/api-error';
import type { EvaluateLotRequest } from '../domain/evaluate-lot.schema';
import { NO_FILTERS } from '../domain/lot-filters';
import { cookiesLot, modelCard, pageOf } from '../testing/fixtures';
import { expiryRiskApi } from './expiry-risk.api';

const fetchMock = vi.fn<typeof fetch>();

const request: EvaluateLotRequest = {
  productId: cookiesLot.product.id,
  receivedOn: '2026-10-01',
  expiresOn: '2026-10-08',
  reviewedOn: '2026-10-04',
  initialQuantity: 48,
  remainingQuantity: 48,
  stockAhead: 2,
  usage7d: 8.4286,
  usage28d: null,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

describe('expiryRiskApi', () => {
  it('asks the proxy for the open lots with the filters in the query string', async () => {
    answer(200, pageOf([cookiesLot]));
    const page = await expiryRiskApi.listLots({ ...NO_FILTERS, level: 'high' });

    expect(fetchMock).toHaveBeenCalledWith('/api/proxy/lot-risk?skip=0&limit=10&level=high', expect.objectContaining({ method: 'GET' }));
    expect(page.data[0]?.product.name).toBe('Galletas de mantequilla');
  });

  it('posts a typed lot as JSON', async () => {
    answer(200, cookiesLot);
    await expiryRiskApi.evaluateLot(request);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/proxy/lot-risk/evaluate');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(request);
  });

  it('reads the model card', async () => {
    answer(200, modelCard);
    expect((await expiryRiskApi.getModelCard()).threshold).toBeCloseTo(0.14);
  });

  it('keeps the API message of a rejected lot', async () => {
    answer(422, { status: 422, error: 'BusinessRule', message: 'No puede quedar más de lo que tenía el lote.', timestamp: '' });
    await expect(expiryRiskApi.evaluateLot(request)).rejects.toEqual(new ApiError(422, 'No puede quedar más de lo que tenía el lote.'));
  });

  it('fails by field name when the API changes its contract', async () => {
    answer(200, { ...cookiesLot, probability: 'alta' });
    await expect(expiryRiskApi.evaluateLot(request)).rejects.toThrow(/probability/);
  });

  it('turns a network failure into a readable error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(expiryRiskApi.getModelCard()).rejects.toEqual(new ApiError(0, 'No hay conexión con el servidor.'));
  });
});
