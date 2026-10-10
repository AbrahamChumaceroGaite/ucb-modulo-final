import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { USER_REPOSITORY } from '../src/contexts/auth/domain/repositories/IUserRepository.interface';
import { BARISTA, FakeUserRepository, TEST_PASSWORD } from '../src/contexts/auth/testing/fake-users';
import { OPEN_LOT_REPOSITORY } from '../src/contexts/expiry_risk/domain/repositories/IOpenLotRepository.interface';
import { FakeOpenLotRepository, openLot } from '../src/contexts/expiry_risk/testing/fake-open-lots';
import { BUSY_MILK, productNamed, SLOW_TOMATOES } from '../src/contexts/expiry_risk/testing/model-files';
import { APP_CONFIG, PG_POOL } from '../src/libs/infrastructure';
import { testConfig } from '../src/libs/testing/test-config';

/**
 * The whole flow over HTTP, with the app `main.ts` boots: global guard,
 * validation pipe, error filter, CQRS buses and the real model files.
 *
 * Only the two database ports are swapped for in-memory fakes, so the suite
 * runs without PostgreSQL. The SQL behind them is checked separately against
 * the restored database (see README, "Prueba de integración").
 */
describe('API /api/v1', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  const tomato = productNamed('Tomate 1 kg');
  const lot = { productId: tomato.productId, ...SLOW_TOMATOES, usage7d: 100 };

  beforeAll(async () => {
    const config = testConfig();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_CONFIG)
      .useValue(config)
      .overrideProvider(PG_POOL)
      .useValue({ end: async () => undefined })
      .overrideProvider(USER_REPOSITORY)
      .useValue(new FakeUserRepository())
      .overrideProvider(OPEN_LOT_REPOSITORY)
      .useValue(
        new FakeOpenLotRepository([openLot('milk-1', 'Leche Pil 1 L', BUSY_MILK), openLot('tomato-1', 'Tomate 1 kg', SLOW_TOMATOES)]),
      )
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, config);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(() => app.close());

  async function signIn(): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await http.post('/api/v1/auth/login').send({ email: BARISTA.email, password: TEST_PASSWORD });
    expect(response.status).toBe(200);
    return response.body;
  }

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('session', () => {
    it('signs in, reads the open lots, refreshes the token and reads them again', async () => {
      const { accessToken, refreshToken } = await signIn();

      const first = await http.get('/api/v1/lot-risk').set(bearer(accessToken));
      expect(first.status).toBe(200);
      expect(first.body.reviewedOn).toBe('2026-03-04');
      expect(first.body.data.map((item: { lotId: string }) => item.lotId)).toEqual(['tomato-1', 'milk-1']);

      const refreshed = await http.post('/api/v1/auth/refresh').send({ refreshToken });
      expect(refreshed.status).toBe(200);

      const second = await http.get('/api/v1/lot-risk').set(bearer(refreshed.body.accessToken));
      expect(second.status).toBe(200);
    });

    it('turns a wrong password into 401 with the shared error body', async () => {
      const response = await http.post('/api/v1/auth/login').send({ email: BARISTA.email, password: 'otra' });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 401,
        error: 'Unauthorized',
        message: 'Correo o contraseña incorrectos.',
        timestamp: expect.any(String),
      });
    });

    it('accepts the email with different case and spaces', async () => {
      const response = await http.post('/api/v1/auth/login').send({ email: '  Barista@KaffeHaus.test ', password: TEST_PASSWORD });
      expect(response.status).toBe(200);
      expect(response.body.user.fullName).toBe('Ana Quispe');
    });

    it('keeps every route but login, refresh and health behind a token', async () => {
      expect((await http.get('/api/v1/lot-risk')).status).toBe(401);
      expect((await http.get('/api/v1/risk-model')).status).toBe(401);
      expect((await http.post('/api/v1/lot-risk/evaluate').send(lot)).status).toBe(401);
      expect((await http.get('/api/v1/health')).status).toBe(200);
    });

    it('does not open the API with a refresh token', async () => {
      const { refreshToken } = await signIn();
      const response = await http.get('/api/v1/lot-risk').set(bearer(refreshToken));
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('El token no es válido o ha expirado.');
    });
  });

  describe('expiry risk', () => {
    let token: string;
    beforeAll(async () => {
      token = (await signIn()).accessToken;
    });

    it('evaluates a typed lot with the real model', async () => {
      const response = await http.post('/api/v1/lot-risk/evaluate').set(bearer(token)).send(lot);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        lotId: null,
        product: { name: 'Tomate 1 kg', unit: 'g' },
        level: 'high',
        atRisk: true,
        coverageRule: true,
        estimatedLeftover: 900,
      });
      expect(response.body.probability).toBeGreaterThan(response.body.threshold);
    });

    it('evaluates a hard case: no 28-day history and the review on the expiry day', async () => {
      const response = await http
        .post('/api/v1/lot-risk/evaluate')
        .set(bearer(token))
        .send({ ...lot, reviewedOn: lot.expiresOn, usage28d: null });
      expect(response.status).toBe(200);
      expect(response.body.daysToExpiry).toBe(0);
      expect(response.body.usage28d).toBeNull();
    });

    it.each([
      ['a field it does not know', { ...lot, price: 12 }, 400, 'El campo «price» no se reconoce.'],
      ['a text where a number goes', { ...lot, usage7d: 'mucho' }, 400, 'usage7d debe ser un número'],
      ['a date in another format', { ...lot, expiresOn: '09/03/2026' }, 400, 'expiresOn debe tener la forma AAAA-MM-DD'],
      ['a product id that is not a UUID', { ...lot, productId: 'tomate' }, 400, 'Elige un producto de la lista.'],
      ['a product the model does not know', { ...lot, productId: '00000000-0000-4000-8000-000000000000' }, 422, 'El modelo no conoce ese producto'],
      ['more left than the lot held', { ...lot, remainingQuantity: 1500 }, 422, 'No puede quedar más de lo que tenía el lote.'],
      ['a lot that already expired', { ...lot, reviewedOn: '2026-03-10' }, 422, 'ya venció'],
    ])('rejects %s', async (_case, body, status, message) => {
      const response = await http.post('/api/v1/lot-risk/evaluate').set(bearer(token)).send(body);
      expect(response.status).toBe(status);
      expect(response.body.message).toContain(message);
    });

    it('filters and paginates the open lots from the query string', async () => {
      const response = await http.get('/api/v1/lot-risk?level=low,watch&family=dairy&limit=5').set(bearer(token));
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ total: 1, limit: 5, hasMore: false });
      expect(response.body.data[0].product.name).toBe('Leche Pil 1 L');
    });

    it('rejects an unknown filter value', async () => {
      const response = await http.get('/api/v1/lot-risk?level=urgent').set(bearer(token));
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('level acepta high, watch o low');
    });

    it('publishes the model card with the baseline next to the model', async () => {
      const response = await http.get('/api/v1/risk-model').set(bearer(token));
      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(12);
      expect(response.body.metrics.model.recall).toBeGreaterThan(response.body.metrics.rule.recall);
      expect(Object.keys(response.body.partitions)).toEqual(['train', 'validation', 'test']);
    });

    it('answers an unknown route in Spanish, without internals', async () => {
      const response = await http.get('/api/v1/lotes').set(bearer(token));
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('La ruta pedida no existe.');
    });
  });
});
