import { APIRequestContext, Page, expect } from '@playwright/test';

/** Senha dos utilizadores de demonstração na base E2E (definida em start-backend.sh). */
export const PASSWORD = process.env['E2E_PASSWORD'] ?? 'E2e-Senha-Teste-2026';

/** API do backend E2E, chamada directamente para preparar dados (sem passar pelo ecrã). */
export const API = `http://localhost:${process.env['E2E_BACKEND_PORT'] ?? 8081}/api`;

/** Inicia sessão pelo ecrã de login, como um utilizador faria. */
export async function login(page: Page, username: string, password = PASSWORD): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Utilizador ou correio electrónico').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function loginAsStaff(page: Page, username: string): Promise<void> {
  await login(page, username);
  await expect(page).toHaveURL(/\/home$/);
}

/** Cliente da API com o token de um utilizador, para preparar cenários. */
export async function apiAs(request: APIRequestContext, username: string) {
  const res = await request.post(`${API}/auth/login`, {
    data: { login: username, password: PASSWORD },
  });
  expect(res.ok(), `login ${username}`).toBeTruthy();
  const { accessToken } = (await res.json()) as { accessToken: string };
  const headers = { Authorization: `Bearer ${accessToken}` };
  const check = async (r: Awaited<ReturnType<APIRequestContext['get']>>) => {
    expect(r.ok(), `${r.url()} → ${r.status()} ${await r.text()}`).toBeTruthy();
    return r.status() === 204 ? null : r.json();
  };
  return {
    get: async (path: string) => check(await request.get(`${API}${path}`, { headers })),
    post: async (path: string, data?: unknown) =>
      check(await request.post(`${API}${path}`, { headers, data })),
    patch: async (path: string, data?: unknown) =>
      check(await request.patch(`${API}${path}`, { headers, data })),
  };
}

/** Sufixo único por execução: os testes não dependem de dados de execuções anteriores. */
export function uniqueSuffix(): string {
  return Date.now().toString(36).toUpperCase();
}
