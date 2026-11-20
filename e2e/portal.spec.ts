import { expect, test } from '@playwright/test';

import { login } from './support/session';

test.describe('Portal do paciente', () => {
  test('o doente entra no portal e vê as suas áreas', async ({ page }) => {
    await login(page, 'doente.demo');
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole('heading', { name: /^Olá, / })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Últimos resultados' })).toBeVisible();

    await page.getByRole('link', { name: 'Resultados' }).click();
    await expect(page).toHaveURL(/\/portal\/results$/);
  });

  test('o doente não entra nas áreas do pessoal', async ({ page }) => {
    await login(page, 'doente.demo');
    await expect(page).toHaveURL(/\/portal$/);
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/portal/);
  });

  test('o pessoal não entra no portal', async ({ page }) => {
    await login(page, 'recepcao.demo');
    await expect(page).toHaveURL(/\/home$/);
    await page.goto('/portal');
    await expect(page).not.toHaveURL(/\/portal/);
  });
});
