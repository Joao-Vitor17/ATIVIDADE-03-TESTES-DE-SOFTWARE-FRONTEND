import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Empréstimos (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'admin@sistema.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard|$/);
  });

  test('deve navegar para a tela de empréstimos', async ({ page }) => {
    await page.goto('/emprestimos');

    await expect(page.locator('h2')).toContainText('Empréstimos');
  });

  test('deve abrir e fechar o modal de novo empréstimo', async ({ page }) => {
    await page.goto('/emprestimos');

    await page.locator('.fab').click();

    await expect(page.locator('.modal')).toBeVisible();

    await page.click('button:has-text("Cancelar")');

    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('deve permitir cadastrar um empréstimo', async ({ page }) => {
    await page.goto('/emprestimos');

    await page.locator('.fab').click();

    const quantidade = await page
    .locator('select[name="livro_id"] option')
    .count();

    console.log('Quantidade:', quantidade);

    await page.selectOption('select[name="livro_id"]', { index: 1 });

    await page.selectOption('select[name="usuario_id"]', { index: 1 });

    const data = new Date();
    data.setDate(data.getDate() + 7);

    const dataFormatada = data.toISOString().split('T')[0];

    await page.fill(
      'input[name="data_devolucao_prevista"]',
      dataFormatada
    );

    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/emprestimos') &&
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

  test('deve permitir editar um empréstimo', async ({ page }) => {
    await page.goto('/emprestimos');

    await page.waitForSelector('.list-card');

    const primeiroCard = page.locator('.list-card').first();

    await primeiroCard
      .locator('.btn--secondary')
      .click();

    await expect(page.locator('.modal')).toBeVisible();

    const novaData = new Date();
    novaData.setDate(novaData.getDate() + 15);

    await page.fill(
      'input[name="data_devolucao_prevista"]',
      novaData.toISOString().split('T')[0]
    );

    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/emprestimos') &&
        resp.request().method() === 'PUT' &&
        resp.status() >= 200 &&
        resp.status() < 300
    );

    await page.getByRole('button', {
      name: 'Confirmar',
    }).click();

    await responsePromise;

    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('deve permitir registrar devolução', async ({ page }) => {
    await page.goto('/emprestimos');

    const botaoDevolver = page
      .locator('button:has-text("Devolver")')
      .first();

    if (await botaoDevolver.count()) {
      await botaoDevolver.click();

      await expect(page.locator('.modal')).toBeVisible();

      const responsePromise = page.waitForResponse(
        resp =>
          resp.url().includes('/emprestimos') &&
          ['PUT', 'PATCH'].includes(resp.request().method()) &&
          resp.status() >= 200 &&
          resp.status() < 300
      );

      await page.click('.modal button:has-text("Confirmar")');

      await responsePromise;

      await expect(page.locator('.modal')).not.toBeVisible();
    }
  });

  test('deve permitir excluir um empréstimo', async ({ page }) => {
    await page.goto('/emprestimos');

    await page.waitForSelector('.list-card');

    const primeiroCard = page.locator('.list-card').first();

    await primeiroCard
      .locator('.btn--danger')
      .click();

    await expect(page.locator('.modal')).toBeVisible();

    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/emprestimos') &&
        resp.request().method() === 'DELETE' &&
        (resp.status() === 204 || resp.status() === 200)
    );

    await page.click('.modal button:has-text("Confirmar")');

    await responsePromise;

    await expect(page.locator('.modal')).not.toBeVisible();
  });
});