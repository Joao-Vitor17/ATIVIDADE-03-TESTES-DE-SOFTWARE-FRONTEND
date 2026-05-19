import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Livros (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'admin@sistema.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard|$/);
  });

  test('deve navegar até a tela de livros e listar o acervo', async ({ page }) => {
    await page.goto('/livros');
    await expect(page.locator('h2')).toContainText('Acervo de Livros');
  });

  test('deve permitir adicionar um novo livro e encontrá-lo na lista', async ({ page }) => {
    const tituloAleatorio = `Livro E2E ${Math.floor(Math.random() * 1000)}`;

    await page.goto('/livros');
    await page.locator('.fab').click();
    await page.fill('input[name="titulo"]', tituloAleatorio);
    await page.fill('input[name="autor"]', 'Automação Playwright');
    await page.click('button[type="submit"]');

    await expect(page.locator('.modal')).not.toBeVisible();

    let encontrado = false;
    for (let i = 0; i < 20; i++) {
      await expect(page.locator('.list-cards')).toBeVisible({ timeout: 5000 });

      if (await page.getByText(tituloAleatorio).isVisible()) {
        encontrado = true;
        break;
      }

      const btnProx = page.locator('button').filter({ has: page.locator('btn btn--secondary btn--sm') });
      if (await btnProx.isVisible() && !(await btnProx.isDisabled())) {
        await btnProx.click();
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }

    expect(encontrado).toBeTruthy();
  });

  test('deve fechar o modal ao clicar no botão cancelar', async ({ page }) => {
    await page.goto('/livros');

    await page.locator('.fab').click();
    await expect(page.locator('.modal')).toBeVisible();

    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  // test de excluir registro
  
  test('deve permitir excluir um livro', async ({ page }) => {
    await page.goto('/livros');
    await page.waitForSelector('.list-card');

    const primeiroLivro = page.locator('.list-card').first();
    const titulo = await primeiroLivro.locator('.list-card__title').innerText();

    await primeiroLivro.locator('button:has-text("Excluir")').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.click('.modal button:has-text("Excluir")', { force: true });

    await expect(page.locator('.modal')).not.toBeVisible();
    await expect(page.locator('.list-card', { hasText: titulo })).not.toBeVisible();
  });

  // test de editar registro
});