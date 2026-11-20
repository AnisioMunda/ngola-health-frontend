import { defineConfig, devices } from '@playwright/test';

/**
 * Testes E2E contra o backend e o frontend verdadeiros, num ambiente isolado:
 * backend na porta 8081 com a base descartável ngolahealth_e2e (recriada a cada arranque, com
 * os dados de demonstração) e frontend na porta 4300. Ver e2e/README.md.
 */
const backendPort = Number(process.env['E2E_BACKEND_PORT'] ?? 8081);
const frontendPort = Number(process.env['E2E_FRONTEND_PORT'] ?? 4300);
const reuse = !process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  // Uma base partilhada: os testes correm em série para não interferirem.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    locale: 'pt-AO',
    timezoneId: 'Africa/Luanda',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // channel 'chromium': o Chromium completo também em modo sem janela (dispensa o headless-shell).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  webServer: [
    {
      command: 'bash e2e/start-backend.sh',
      url: `http://localhost:${backendPort}/api/actuator/health/readiness`,
      timeout: 300_000,
      reuseExistingServer: reuse,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npx ng serve --port ${frontendPort} --proxy-config e2e/proxy.e2e.json`,
      url: `http://localhost:${frontendPort}`,
      timeout: 180_000,
      reuseExistingServer: reuse,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
