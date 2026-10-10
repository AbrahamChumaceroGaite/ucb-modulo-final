import { expect, test, type Page } from '@playwright/test';

/** Development account created by `api/database/seed-admin.sql`. */
const ADMIN = { email: 'admin@kaffehaus.bo', password: 'Kaffehaus2026!' };

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByLabel('Correo', { exact: true }).fill(ADMIN.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/vencimientos$/);
}

interface TypedLot {
  product: string;
  unit: string;
  receivedOn: string;
  expiresOn: string;
  reviewedOn: string;
  initial: string;
  remaining: string;
  ahead: string;
  usage7d: string;
  usage28d: string;
}

async function typeLot(page: Page, lot: TypedLot) {
  await page.getByLabel('Producto', { exact: true }).selectOption({ label: lot.product });
  await page.getByLabel('Ingresó', { exact: true }).fill(lot.receivedOn);
  await page.getByLabel('Vence', { exact: true }).fill(lot.expiresOn);
  await page.getByLabel('Día de revisión', { exact: true }).fill(lot.reviewedOn);
  await page.getByLabel(`Cantidad inicial (${lot.unit})`, { exact: true }).fill(lot.initial);
  await page.getByLabel(`Queda (${lot.unit})`, { exact: true }).fill(lot.remaining);
  await page.getByLabel(`Por delante en FEFO (${lot.unit})`, { exact: true }).fill(lot.ahead);
  await page.getByLabel(`Uso diario, 7 días (${lot.unit})`, { exact: true }).fill(lot.usage7d);
  await page.getByLabel(`Uso diario, 28 días (${lot.unit})`, { exact: true }).fill(lot.usage28d);
  await page.getByRole('button', { name: 'Evaluar lote' }).click();
}

const result = (page: Page) => page.getByRole('region', { name: 'Resultado de la evaluación' });

test.describe('sesión', () => {
  test('sin sesión, la pantalla de lotes manda a entrar', async ({ page }) => {
    await page.goto('/vencimientos');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('una contraseña incorrecta muestra el mensaje de la API', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Correo', { exact: true }).fill(ADMIN.email);
    await page.getByLabel('Contraseña', { exact: true }).fill('no-es-esta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo entrar' })).toContainText('Correo o contraseña incorrectos.');
  });
});

test.describe('lotes por vencer', () => {
  test.beforeEach(async ({ page }) => signIn(page));

  test('flujo completo: lista los lotes abiertos de la base, ordenados por riesgo', async ({ page }) => {
    await expect(page.getByText('Mañana del 4 oct 2026.', { exact: false })).toBeVisible();
    await expect(page.getByText('1–10 de 17')).toBeVisible();

    const first = page.getByRole('article').first();
    await expect(first.getByRole('heading', { name: 'Galletas de mantequilla' })).toBeVisible();
    await expect(first.getByText('Usar primero')).toBeVisible();

    await page.getByRole('group', { name: 'Nivel de riesgo' }).getByRole('button', { name: 'Usar primero' }).click();
    await expect(page.getByText('1–2 de 2')).toBeVisible();
  });

  test('caso válido: el lote copiado de la lista da la misma probabilidad que la lista', async ({ page }) => {
    const first = page.getByRole('article').first();
    const listed = await first.getByRole('meter').getAttribute('aria-valuenow');
    await first.getByRole('button', { name: 'Probar cambios' }).click();
    await page.getByRole('button', { name: 'Evaluar lote' }).click();

    await expect(result(page).getByText('Usar primero')).toBeVisible();
    await expect(result(page).getByRole('meter')).toHaveAttribute('aria-valuenow', listed ?? '');
  });

  test('caso válido escrito a mano: leche que rota rápido no se marca', async ({ page }) => {
    await typeLot(page, {
      product: 'Leche Pil 1 L',
      unit: 'ml',
      receivedOn: '2026-10-02',
      expiresOn: '2026-10-12',
      reviewedOn: '2026-10-04',
      initial: '8000',
      remaining: '6000',
      ahead: '0',
      usage7d: '4500',
      usage28d: '4100',
    });
    await expect(result(page).getByText('Riesgo bajo')).toBeVisible();
    await expect(result(page).getByText('Se termina a tiempo.')).toBeVisible();
  });

  test('caso difícil: sin historial de 28 días y revisado el mismo día que vence', async ({ page }) => {
    await typeLot(page, {
      product: 'Tomate 1 kg',
      unit: 'g',
      receivedOn: '2026-09-28',
      expiresOn: '2026-10-04',
      reviewedOn: '2026-10-04',
      initial: '1000',
      remaining: '600',
      ahead: '0',
      usage7d: '140',
      usage28d: '',
    });
    await expect(result(page).getByText('hoy (4 oct 2026)')).toBeVisible();
    await expect(result(page).getByRole('meter')).toBeVisible();
    await expect(result(page).getByText('Unos 460 g')).toBeVisible();
  });

  test('entrada inválida: el formulario marca el campo y no llama al modelo', async ({ page }) => {
    let calls = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/lot-risk/evaluate')) calls += 1;
    });
    await page.getByLabel('Uso diario, 7 días', { exact: true }).fill('mucho');
    await page.getByRole('button', { name: 'Evaluar lote' }).click();

    await expect(page.getByText('Elige un producto.')).toBeVisible();
    await expect(page.getByText('Escribe un número.')).toBeVisible();
    expect(calls).toBe(0);
  });

  test('entrada inválida: la API explica por qué rechaza el lote', async ({ page }) => {
    await typeLot(page, {
      product: 'Croissant bandeja x12',
      unit: 'und',
      receivedOn: '2026-10-03',
      expiresOn: '2026-10-05',
      reviewedOn: '2026-10-04',
      initial: '12',
      remaining: '20',
      ahead: '0',
      usage7d: '6',
      usage28d: '6',
    });
    // Next.js adds its own route announcer with role="alert"; take ours by its title.
    const alert = page.getByRole('alert').filter({ hasText: 'No se pudo evaluar' });
    await expect(alert).toContainText('No puede quedar más de lo que tenía el lote.');
  });

  test('el recorrido guiado explica la pantalla paso a paso', async ({ page }) => {
    const popover = page.locator('.driver-popover');
    await page.getByRole('button', { name: 'Cómo funciona' }).click();
    await expect(popover).toContainText('Cómo funciona');
    await expect(popover).toContainText('1 de 8');

    const titles = ['Un lote', 'Lo que mira el modelo', 'El riesgo', 'Filtros', 'Probar cambios', 'Evaluar un lote', 'Qué tan bien funciona'];
    for (const title of titles) {
      await popover.getByRole('button', { name: 'Siguiente' }).click();
      await expect(popover.locator('.driver-popover-title')).toHaveText(title);
    }
    await popover.getByRole('button', { name: 'Listo' }).click();
    await expect(popover).toBeHidden();
  });

  test('salir borra la sesión', async ({ page }) => {
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/vencimientos');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('pantalla', () => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`consola limpia y sin scroll horizontal (movimiento: ${reducedMotion})`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion });
      await signIn(page);

      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.getByRole('article').first()).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `scroll horizontal a ${width} px`).toBeLessThanOrEqual(0);
      }
      expect(errors).toEqual([]);
    });
  }
});
