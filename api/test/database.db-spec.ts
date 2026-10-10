import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { UserPostgresRepository } from '../src/contexts/auth/infrastructure/persistence/user.postgres.repository';
import { OpenLotPostgresRepository } from '../src/contexts/expiry_risk/infrastructure/persistence/open-lot.postgres.repository';
import { realRiskModel } from '../src/contexts/expiry_risk/testing/model-files';
import { APP_CONFIG, readConfig } from '../src/libs/infrastructure';

/**
 * The real thing: the restored Kaffehaus database, no fakes.
 *
 * The Postgres repository rebuilds in SQL and TypeScript what
 * `training/src/build_dataset.py` builds in pandas. If the two disagreed, the
 * API would feed the model inputs it never saw in training. The check is the
 * snapshot morning (2026-10-04): the API must find exactly the open lots
 * training exported, with the same numbers.
 */
interface TrainingOpenLot {
  lot_id: string;
  product_id: string;
  received_on: string;
  expires_on: string;
  reviewed_on: string;
  initial_quantity: number;
  remaining_quantity: number;
  stock_ahead: number;
  usage_7d: number | null;
  usage_28d: number | null;
}

const trainingLots: TrainingOpenLot[] = JSON.parse(
  readFileSync(join(__dirname, '../training/data/open_lots.json'), 'utf8'),
);

/** Development account created by `database/seed-admin.sql`. */
const ADMIN = { email: 'admin@kaffehaus.bo', password: 'Kaffehaus2026!' };

describe('restored database', () => {
  const config = readConfig();
  const pool = new Pool({ connectionString: config.databaseUrl, max: 2 });
  afterAll(() => pool.end());

  describe('OpenLotPostgresRepository', () => {
    const lots = new OpenLotPostgresRepository(pool);

    it('takes the last movement day of the snapshot as the latest data', async () => {
      expect(await lots.latestDataDay()).toBe('2026-10-03');
    });

    it('finds the same open lots, with the same inputs, that training exported', async () => {
      const reviewedOn = trainingLots[0]!.reviewed_on;
      const found = await lots.findOpen(reviewedOn, realRiskModel().productIds);

      const byId = (a: { lotId: string }, b: { lotId: string }) => a.lotId.localeCompare(b.lotId);
      const expected = trainingLots
        .map((lot) => ({
          lotId: lot.lot_id,
          productId: lot.product_id,
          receivedOn: lot.received_on,
          expiresOn: lot.expires_on,
          reviewedOn: lot.reviewed_on,
          initialQuantity: lot.initial_quantity,
          remainingQuantity: lot.remaining_quantity,
          stockAhead: lot.stock_ahead,
          usage7d: lot.usage_7d,
          usage28d: lot.usage_28d,
        }))
        .sort(byId);

      expect([...found].sort(byId)).toEqual(expected);
      expect(found).toHaveLength(17);
    });
  });

  describe('UserPostgresRepository', () => {
    const users = new UserPostgresRepository(pool);

    it('finds the seeded account ignoring case, with its role', async () => {
      const account = await users.findByEmail('ADMIN@kaffehaus.bo');
      expect(account).toMatchObject({ email: ADMIN.email, roleName: 'Administrador' });
      expect(account!.passwordHash).toMatch(/^pbkdf2\$/);
      expect(await users.findById(account!.id)).toEqual(account);
    });

    it('returns null for an email that is not there', async () => {
      expect(await users.findByEmail('nadie@kaffehaus.bo')).toBeNull();
    });
  });

  describe('HTTP, with nothing replaced', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(APP_CONFIG)
        .useValue(config)
        .compile();
      app = moduleRef.createNestApplication({ logger: false });
      configureApp(app, config);
      await app.init();
    });

    afterAll(() => app.close());

    it('signs in with the seeded account and scores every open lot', async () => {
      const http = request(app.getHttpServer());
      const login = await http.post('/api/v1/auth/login').send(ADMIN);
      expect(login.status).toBe(200);
      expect(login.body.user.roleName).toBe('Administrador');

      const page = await http
        .get('/api/v1/lot-risk?limit=50')
        .set('Authorization', `Bearer ${login.body.accessToken}`);
      expect(page.status).toBe(200);
      expect(page.body.reviewedOn).toBe('2026-10-04');
      expect(page.body.total).toBe(17);

      const probabilities = page.body.data.map((lot: { probability: number }) => lot.probability);
      expect(probabilities).toEqual([...probabilities].sort((a, b) => b - a));
      for (const value of probabilities) expect(value).toBeGreaterThanOrEqual(0);
    });

    it('rejects a wrong password for a real account', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN.email, password: 'no-es-esta' });
      expect(response.status).toBe(401);
    });
  });
});
