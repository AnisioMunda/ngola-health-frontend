import { expect, test } from '@playwright/test';

import { PASSWORD, login } from './support/session';

/** Senha escolhida pelo administrador na troca obrigatória do primeiro acesso. */
const NEW_PASSWORD = `${PASSWORD}-Nova`;

test('a administração da plataforma troca a senha inicial e vê o estado do sistema', async ({
  page,
}) => {
  await login(page, 'platform-admin');
  // Base nova: a conta tem senha temporária e a troca é obrigatória. Base reutilizada (execução
  // local repetida): a senha já foi trocada numa execução anterior.
  const alert = page.getByRole('alert');
  await Promise.race([
    page.waitForURL(/\/(change-password|home)/),
    alert.waitFor({ state: 'visible' }),
  ]);
  if (await alert.isVisible()) {
    await login(page, 'platform-admin', NEW_PASSWORD);
  }
  if (/change-password/.test(page.url())) {
    await expect(page.getByRole('heading', { name: 'Alterar senha' })).toBeVisible();
    await page.getByLabel('Senha actual').fill(PASSWORD);
    await page.getByRole('textbox', { name: /^Nova senha/ }).fill(NEW_PASSWORD);
    await page.getByLabel('Confirmar nova senha').fill(NEW_PASSWORD);
    await page.locator('form button[type="submit"]').click();
  }
  await expect(page).toHaveURL(/\/home$/);

  await page
    .getByRole('navigation')
    .first()
    .getByRole('link', { name: 'Estado do sistema' })
    .click();
  await expect(page.getByRole('heading', { name: 'Estado do sistema' })).toBeVisible();
  await expect(page.getByText('Disponível')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tarefas agendadas' })).toBeVisible();
});
