import { expect, test } from '@playwright/test';

import { loginAsStaff, uniqueSuffix } from './support/session';

test('a enfermagem tria um doente não identificado e ele entra na fila', async ({ page }) => {
  const tempName = `Desconhecido E2E ${uniqueSuffix()}`;
  await loginAsStaff(page, 'enfermeira.demo');

  await page.goto('/triage/new');
  await page.getByLabel('Provisório (identificar depois)').check();
  await page.getByLabel('Nome provisório *').fill(tempName);
  await page.getByLabel('Idade aproximada').fill('40');
  await page.getByLabel('Vermelho · Imediato').check();
  await page.getByLabel('Queixa principal *').fill('Dor torácica intensa');
  await page.getByRole('button', { name: 'Registar e atribuir senha' }).click();

  await expect(page).toHaveURL(/\/triage$/);
  await expect(page.getByRole('status')).toContainText(`atribuída a ${tempName}`);
  await expect(page.getByText(tempName).first()).toBeVisible();
});
