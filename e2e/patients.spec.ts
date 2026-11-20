import { Page, expect, test } from '@playwright/test';

import { loginAsStaff, uniqueSuffix } from './support/session';

/**
 * Nome único por execução. O aviso de duplicado compara o primeiro e o último nome com a mesma
 * data de nascimento, por isso o sufixo vai no primeiro nome.
 */
function uniqueName(): string {
  return `E2E${uniqueSuffix()} Domingos Teste`;
}

async function fillNewPatient(page: Page, name: string, birthDate: string): Promise<void> {
  await page.goto('/patients/new');
  await expect(page.getByRole('heading', { name: 'Registar paciente' })).toBeVisible();
  await page.getByLabel('Nome completo *').fill(name);
  await page.getByLabel('Data de nascimento *').fill(birthDate);
  await page.getByLabel('Género *').selectOption({ label: 'Feminino' });
  await page.getByRole('button', { name: 'Registar paciente' }).click();
}

test('a recepção regista um paciente e encontra-o na pesquisa', async ({ page }) => {
  const name = uniqueName();
  await loginAsStaff(page, 'recepcao.demo');

  await fillNewPatient(page, name, '1990-05-17');
  // Ficha do paciente com número de processo atribuído.
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText(/Processo/)).toBeVisible();

  await page.goto('/patients');
  await page.getByLabel('Pesquisar').fill(name);
  await page.getByLabel('Pesquisar').press('Enter');
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'Abrir ficha' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
});

test('um possível duplicado é assinalado antes de criar outro processo', async ({ page }) => {
  const name = uniqueName();
  await loginAsStaff(page, 'recepcao.demo');
  await fillNewPatient(page, name, '1985-02-03');
  await expect(page.getByRole('heading', { name })).toBeVisible();

  // Mesmo nome e data: a aplicação mostra o processo existente e pede confirmação.
  await fillNewPatient(page, name, '1985-02-03');
  const warning = page.getByRole('alertdialog', { name: 'Possível paciente já registado' });
  await expect(warning).toBeVisible();
  await expect(warning.getByRole('link', { name })).toBeVisible();
  await warning.getByRole('button', { name: 'É outra pessoa, registar' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
});

test('o registo sem os campos obrigatórios não avança', async ({ page }) => {
  await loginAsStaff(page, 'recepcao.demo');
  await page.goto('/patients/new');
  await page.getByRole('button', { name: 'Registar paciente' }).click();
  await expect(page).toHaveURL(/\/patients\/new$/);
  await expect(page.locator('.field-error').first()).toBeVisible();
});
