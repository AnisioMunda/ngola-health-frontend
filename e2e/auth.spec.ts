import { expect, test } from '@playwright/test';

import { login, loginAsStaff } from './support/session';

test.describe('Sessão e acessos', () => {
  test('senha errada mostra o erro e não entra', async ({ page }) => {
    await login(page, 'recepcao.demo', 'senha-errada-123');
    await expect(page.getByRole('alert')).toContainText('Utilizador ou senha incorrectos');
    await expect(page).toHaveURL(/\/login/);
  });

  test('entrar, ver as áreas do perfil e sair', async ({ page }) => {
    await loginAsStaff(page, 'recepcao.demo');
    await expect(page.getByRole('heading', { name: 'Olá, Celeste Recepção' })).toBeVisible();
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: 'Pacientes' })).toBeVisible();
    // A recepção não vê auditoria nem administração.
    await expect(nav.getByRole('link', { name: 'Auditoria' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login/);
    // Depois de sair, as páginas protegidas pedem login outra vez.
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('um perfil sem acesso é devolvido ao início', async ({ page }) => {
    await loginAsStaff(page, 'recepcao.demo');
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/home$/);
  });

  test('página protegida sem sessão leva ao login e volta depois de entrar', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel('Utilizador ou correio electrónico').fill('recepcao.demo');
    await page
      .locator('input[autocomplete="current-password"]')
      .fill(process.env['E2E_PASSWORD'] ?? 'E2e-Senha-Teste-2026');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/patients$/);
  });
});
