# Testes E2E (Playwright)

Testam os fluxos críticos no browser, contra o backend e o frontend verdadeiros e uma base MySQL
real, num ambiente isolado que não toca na base de desenvolvimento:

| Peça     | Porta | Notas                                                                                         |
| -------- | ----- | --------------------------------------------------------------------------------------------- |
| Backend  | 8081  | base **descartável** `ngolahealth_e2e`, recriada a cada arranque com os dados de demonstração |
| Frontend | 4300  | `ng serve` com `e2e/proxy.e2e.json` (encaminha `/api` para a 8081)                            |

Os utilizadores são os de demonstração (`*.demo`, `platform-admin`), com a senha de teste
`E2e-Senha-Teste-2026` (só existe nesta base; `E2E_PASSWORD` muda-a).

## Correr

```bash
npm run e2e                 # arranca backend e frontend se não estiverem a correr, testa e pára-os
npx playwright test e2e/lab.spec.ts      # um ficheiro
npx playwright test --headed             # ver o browser
npm run e2e:report          # relatório HTML da última execução (com traces das falhas)
```

Precisa do `backend/.env` (ligação ao MySQL) e, na primeira vez, do browser:
`npx playwright install chromium`.

- **Local**: se o backend E2E (8081) ou o frontend (4300) já estiverem a correr, são
  reutilizados (a base não é recriada). Os testes geram nomes únicos e funcionam com a base já
  usada.
- **CI** (`CI=1`): arranca tudo de novo, base limpa; sem `test.only`; uma nova tentativa em caso de
  falha.

## O que está coberto

| Ficheiro           | Fluxo                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts`     | senha errada; entrar e sair; menu por perfil; perfil sem acesso; voltar à página pedida depois do login |
| `patients.spec.ts` | registar paciente e encontrá-lo; aviso de possível duplicado; campos obrigatórios                       |
| `triage.spec.ts`   | triagem de doente não identificado com prioridade vermelha; entra na fila                               |
| `lab.spec.ts`      | pedido do médico (preparado pela API) → colheita → análise → resultado → validação (ecrã)               |
| `portal.spec.ts`   | doente entra no portal; doente não entra nas áreas do pessoal; pessoal não entra no portal              |
| `system.spec.ts`   | troca obrigatória da senha inicial; estado do sistema                                                   |

## Escrever testes

- Seleccione pelo que o utilizador vê: `getByRole`, `getByLabel`, textos. Evite classes CSS.
- Dados próprios de cada teste com `uniqueSuffix()`; nunca dependa da ordem dos testes.
- Para preparar cenários longos use a API (`apiAs` em `support/session.ts`) e teste pelo ecrã
  só a parte que interessa.
