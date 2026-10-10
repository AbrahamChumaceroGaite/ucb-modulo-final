import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import request from 'supertest';

/**
 * The whole flow over HTTP, with the same app `main.ts` boots: guard, pipes,
 * filter, CQRS, model file and seed. Nothing is mocked.
 */
const SECRETO = 'desarrollo-kaffehaus-secreto-de-acceso-cambiar-en-produccion';
process.env.JWT_SECRET = SECRETO;
process.env.JWT_ISSUER = 'kaffehausv4';
process.env.MODELO_DIR = join(__dirname, '../modelo');

// Required after the env is set: the configuration is read at module init.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppModule } = require('../src/app.module') as typeof import('../src/app.module');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { configurarApp } = require('../src/configurar-app') as typeof import('../src/configurar-app');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { leerConfiguracion } = require('../src/libs/src') as typeof import('../src/libs/src');

/** A token exactly like the one Spring issues (HS384 with the dev secret). */
const token = (tipo = 'acceso', algoritmo: 'HS256' | 'HS384' = 'HS384') =>
  sign({ nombreCompleto: 'Ana Pérez', rolId: 'r1', rolNombre: 'Administrador', tipo }, SECRETO, {
    algorithm: algoritmo,
    issuer: 'kaffehausv4',
    subject: 'u1',
    expiresIn: '15m',
  });

const lote = {
  codigoInsumo: 'FRU-FRE',
  fechaIngreso: '2026-10-02',
  fechaVencimiento: '2026-10-05',
  fechaRevision: '2026-10-03',
  cantidadInicial: 1.5,
  cantidadRestante: 1.38,
  stockPorDelante: 0,
  consumo7d: 0.47,
  consumo28d: 0.52,
};

describe('flujo completo /api/v1', () => {
  let app: INestApplication;
  const autorizado = () => ({ Authorization: `Bearer ${token()}` });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app, leerConfiguracion());
    await app.init();
  });

  afterAll(() => app.close());

  it('sin token responde 401 con la forma de error de Spring', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/v1/evaluacion-lote');
    expect(respuesta.status).toBe(401);
    expect(Object.keys(respuesta.body).sort()).toEqual(['codigo', 'mensaje', 'timestamp', 'tipo']);
  });

  it('rechaza el refresh token aunque esté bien firmado', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/evaluacion-lote')
      .set('Authorization', `Bearer ${token('refresco')}`);
    expect(respuesta.status).toBe(401);
  });

  it('acepta HS256 y HS384, como los que emite jjwt según la longitud del secreto', async () => {
    for (const algoritmo of ['HS256', 'HS384'] as const) {
      const respuesta = await request(app.getHttpServer())
        .get('/api/v1/modelo-riesgo')
        .set('Authorization', `Bearer ${token('acceso', algoritmo)}`);
      expect(respuesta.status).toBe(200);
    }
  });

  it('arranca con el inventario evaluado por el modelo, paginado como Spring', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/v1/evaluacion-lote?limit=5').set(autorizado());
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ skip: 0, limit: 5 });
    expect(respuesta.body.total).toBeGreaterThan(5);
    expect(respuesta.body.data[0]).toMatchObject({ origen: 'inventario', versionModelo: '1.0.0' });
  });

  it('caso válido: registrar → leer → buscar → quitar → ya no existe', async () => {
    const servidor = app.getHttpServer();

    const creada = await request(servidor).post('/api/v1/evaluacion-lote').set(autorizado()).send(lote);
    expect(creada.status).toBe(201);
    expect(creada.body).toMatchObject({ codigoInsumo: 'FRU-FRE', origen: 'manual', nivel: 'alto' });

    const leida = await request(servidor).get(`/api/v1/evaluacion-lote/${creada.body.id}`).set(autorizado());
    expect(leida.body).toEqual(creada.body);

    const buscada = await request(servidor).get('/api/v1/evaluacion-lote?search=frutilla&riesgo=alto').set(autorizado());
    expect(buscada.body.data.map((e: { id: string }) => e.id)).toContain(creada.body.id);

    const borrada = await request(servidor).delete(`/api/v1/evaluacion-lote/${creada.body.id}`).set(autorizado());
    expect(borrada.status).toBe(204);

    const otraVez = await request(servidor).get(`/api/v1/evaluacion-lote/${creada.body.id}`).set(autorizado());
    expect(otraVez.status).toBe(404);
    expect(otraVez.body.mensaje).toBe('No encontramos esa evaluación.');
  });

  it('revisar otra vez el mismo lote reemplaza la evaluación anterior, no la duplica', async () => {
    const servidor = app.getHttpServer();
    const primera = await request(servidor).post('/api/v1/evaluacion-lote').set(autorizado()).send(lote);
    const segunda = await request(servidor)
      .post('/api/v1/evaluacion-lote')
      .set(autorizado())
      .send({ ...lote, fechaRevision: '2026-10-04', cantidadRestante: 0.9 });

    expect(segunda.status).toBe(201);
    expect((await request(servidor).get(`/api/v1/evaluacion-lote/${primera.body.id}`).set(autorizado())).status).toBe(404);
    const iguales = await request(servidor).get('/api/v1/evaluacion-lote?search=frutilla&limit=50').set(autorizado());
    const delLote = iguales.body.data.filter(
      (e: { fechaIngreso: string; cantidadInicial: number }) => e.fechaIngreso === lote.fechaIngreso && e.cantidadInicial === lote.cantidadInicial,
    );
    expect(delLote.map((e: { id: string }) => e.id)).toEqual([segunda.body.id]);
  });

  it('caso difícil: sin consumo de 28 días y el lote vence hoy', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/evaluacion-lote')
      .set(autorizado())
      .send({ ...lote, fechaRevision: '2026-10-05', cantidadRestante: 0.9, consumo28d: null });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({ diasParaVencer: 0, consumo28d: null });
  });

  it('entrada inválida: 400 con el primer problema, en español', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/evaluacion-lote')
      .set(autorizado())
      .send({ ...lote, fechaIngreso: '02/10/2026', campoRaro: 1 });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toMatchObject({ codigo: 400, tipo: 'Validación' });
    expect(respuesta.body.mensaje).toMatch(/AAAA-MM-DD|no se reconoce/);
  });

  it('regla de negocio: queda más de lo que se compró → 422', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/evaluacion-lote')
      .set(autorizado())
      .send({ ...lote, cantidadRestante: 3 });
    expect(respuesta.status).toBe(422);
    expect(respuesta.body.mensaje).toBe('No puede quedar más de lo que se compró.');
  });

  it('un filtro con un nivel que no existe es 400, no una lista vacía', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/v1/evaluacion-lote?riesgo=critico').set(autorizado());
    expect(respuesta.status).toBe(400);
  });
});
