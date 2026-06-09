import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Multas (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'admin@sistema.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard|$/);
  });

  test('deve navegar para a tela de multas', async ({ page }) => {
    await page.goto('/multas');

    await expect(page.locator('h2')).toContainText('Multas');
  });

  test('deve abrir e fechar o modal de nova multa', async ({ page }) => {
    await page.goto('/multas');

    await page.locator('.fab').click();

    await expect(page.locator('.modal')).toBeVisible();

    await page.click('button:has-text("Cancelar")');

    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('deve permitir cadastrar uma multa', async ({ page }) => {
    await page.goto('/multas');

    await page.locator('.fab').click();

    await expect(page.locator('.modal')).toBeVisible();

    await page.selectOption(
      'select[name="emprestimo_id"]',
      { index: 1 }
    );

    await page.selectOption(
      'select[name="tipo"]',
      'Atraso'
    );

    await page.fill(
      'input[name="valor"]',
      '15.50'
    );

    await page.fill(
      'input[name="descricao"]',
      'Multa gerada por atraso na devolução'
    );

    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/multas') &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300
    );

    await page.getByRole('button', {
      name: 'Confirmar',
    }).click();

    await responsePromise;

    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('deve permitir editar uma multa', async ({ page }) => {
    await page.goto('/multas');

    await page.waitForSelector('.list-card');

    const primeiroCard = page.locator('.list-card').first();

    await primeiroCard
      .locator('.btn--secondary')
      .click();

    await expect(page.locator('.modal')).toBeVisible();

    await page.fill(
      'input[name="valor"]',
      '25.00'
    );

    await page.fill(
      'input[name="descricao"]',
      'Valor atualizado pelo administrador'
    );

    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/multas') &&
        ['PUT', 'PATCH'].includes(resp.request().method()) &&
        resp.status() >= 200 &&
        resp.status() < 300
    );

    await page.getByRole('button', {
      name: 'Confirmar',
    }).click();

    await responsePromise;

    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('deve permitir quitar uma multa', async ({ page }) => {
    await page.goto('/multas');

    const botaoQuitar = page
      .locator('button:has-text("Quitar Multa")')
      .first();

    if (await botaoQuitar.count()) {
      await botaoQuitar.click();

      await expect(page.locator('.modal')).toBeVisible();

      const responsePromise = page.waitForResponse(
        resp =>
          resp.url().includes('/multas') &&
          ['PUT', 'PATCH'].includes(resp.request().method()) &&
          resp.status() >= 200 &&
          resp.status() < 300
      );

      await page.click('button:has-text("Sim, confirmar")');

      await responsePromise;

      await expect(page.locator('.modal')).not.toBeVisible();
    }
  });

  test('deve permitir excluir uma multa', async ({ page }) => {
    await page.goto('/multas');

    await page.waitForSelector('.list-card');

    const primeiroCard = page.locator('.list-card').first();

    await primeiroCard
      .locator('.btn--danger')
      .click();

    await expect(page.locator('.modal')).toBeVisible();

    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/multas') &&
        resp.request().method() === 'DELETE' &&
        (resp.status() === 200 || resp.status() === 204)
    );

    await page.click('button:has-text("Sim, confirmar")');

    await responsePromise;

    await expect(page.locator('.modal')).not.toBeVisible();
  });
});