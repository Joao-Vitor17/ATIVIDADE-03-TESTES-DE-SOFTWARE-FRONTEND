import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Usuarios (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'admin@sistema.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard|$/);
  });

  test('deve navegar até a tela de usuarios e listar os membros', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page.locator('h2')).toContainText('Gestão de Usuários');
  });

  test('deve permitir adicionar um novo usuario', async ({ page }) => {
    const nomeAleatorio = `Usuário E2E ${Math.floor(Math.random() * 1000)}`;
    const emailAleatorio = `e2e_${Math.floor(Math.random() * 1000)}@teste.com`;

    await page.goto('/usuarios');
    await page.locator('.fab').click();

    await page.fill('input[name="nome"]', nomeAleatorio);
    await page.fill('input[name="email"]', emailAleatorio);
    await page.click('input[name="senha"]', 'senha123');
    await page.selectOption('select[name="tipo"]', 'aluno');

    const responsePromise = page.waitForResponse(resp => resp.url().includes('/usuarios') && resp.request().method() === 'PUT' && resp.status() >= 200 && resp.status() < 300);

    await page.getByRole('button', { name: 'Confirmar' }).click();
   
    const response = await responsePromise;
    const data = await response.json();
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('deve fechar o modal ao clicar no botão cancelar', async ({ page }) => {
    await page.goto('/usuarios');

    await page.locator('.fab').click();
    await expect(page.locator('.modal')).toBeVisible();

    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  // test de excluir registro
  
  test('deve permitir excluir um usuario', async ({ page }) => {
    await page.goto('/usuarios');
    await page.waitForSelector('.list-card');

    const primeiroUsuario = page.locator('.list-card').first();
    const titulo = await primeiroUsuario.locator('.list-card__title').innerText();

    await primeiroUsuario.locator('button:has-text("Excluir")').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.click('.modal button:has-text("Confirmar")', { force: true });

    await expect(page.locator('.modal')).not.toBeVisible();
    await expect(page.locator('.list-card', { hasText: titulo })).not.toBeVisible();
  });

  // test de editar registro
  test('deve permitir editar um usuario', async ({ page }) => {
    await page.goto('/usuarios');
    await page.waitForSelector('.list-card');

    const primeiroNome = page.locator('.list-card').first();
    const nomeOriginal = await primeiroNome.locator('.list-card__title').innerText();

    await primeiroNome.locator('button:has-text("Editar")').click();
    await expect(page.locator('.modal')).toBeVisible();

    const inputNome = page.locator('input[name="nome"]');
    await inputNome.click();
    await inputNome.fill(nomeOriginal + 'EDITADO');

    const responsePromise = page.waitForResponse(resp => resp.url().includes('/usuarios') && resp.request().method() === 'PUT' && resp.status() >= 200 && resp.status() < 300);

    await page.getByRole('button', { name: 'Confirmar' }).click();
    await responsePromise;

    await expect(page.locator('modal')).not.toBeVisible();
    await expect(page.locator('.list-card', { hasText: nomeOriginal + 'EDITADO' })).toBeVisible();
  });
});