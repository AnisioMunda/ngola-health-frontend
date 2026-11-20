import { expect, test } from '@playwright/test';

import { apiAs, loginAsStaff, uniqueSuffix } from './support/session';

interface Page<T> {
  content: T[];
}

/**
 * Do pedido ao resultado validado. O pedido é preparado pela API (médico: episódio em curso e
 * pedido de exames); o trabalho do laboratório é feito pelo ecrã.
 */
test('o laboratório colhe, analisa e valida um pedido', async ({ page, request }) => {
  const doctor = await apiAs(request, 'medico.demo');
  const me = (await doctor.get('/auth/me')) as { id: string };
  const patients = (await doctor.get('/patients?size=1')) as Page<{ id: string }>;
  const episode = (await doctor.post('/episodes', {
    patientId: patients.content[0].id,
    type: 'OUTPATIENT',
    doctorId: me.id,
    reason: `Consulta E2E ${uniqueSuffix()}`,
  })) as { id: string };
  await doctor.patch(`/episodes/${episode.id}/start`);
  const tests = (await doctor.get('/lab/tests?active=true')) as {
    id: string;
    name: string;
    resultType: string;
  }[];
  const numeric = tests.find((t) => t.resultType === 'NUMERIC');
  expect(numeric, 'catálogo com um exame numérico').toBeTruthy();
  const labRequest = (await doctor.post('/lab/requests', {
    episodeId: episode.id,
    priority: 'URGENT',
    clinicalInfo: 'Pedido criado pelos testes E2E',
    testIds: [numeric!.id],
  })) as { id: string; number: string };

  await loginAsStaff(page, 'lab.demo');
  await page.goto(`/lab/requests/${labRequest.id}`);
  await expect(page.getByRole('heading', { name: `Pedido ${labRequest.number}` })).toBeVisible();

  await page.getByLabel('Notas da colheita').fill('Colheita sem intercorrências');
  await page.getByRole('button', { name: 'Registar colheita' }).click();
  await expect(page.getByText(/Colheita .* por/)).toBeVisible();

  await page.getByRole('button', { name: 'Iniciar análise' }).click();
  await page.getByLabel(`Valor de ${numeric!.name}`).fill('5.2');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Por validar')).toBeVisible();

  await page.getByRole('button', { name: 'Validar' }).click();
  await expect(page.getByText('Validado')).toBeVisible();
});
