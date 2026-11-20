# CI e segurança (GitHub Actions)

| Workflow           | Quando                  | O quê                                                                                                          |
| ------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ci.yml` → check   | push em `main`, PRs     | Prettier, testes unitários, build de produção, tipos dos E2E                                                   |
| `ci.yml` → e2e     | depois do check         | Playwright contra o backend verdadeiro (repositório `ngola-health-backend`, ramo `main`) e MySQL 9             |
| `ci.yml` → secrets | push, PRs               | gitleaks em todo o histórico (excepções em `.gitleaks.toml`)                                                   |
| `zap.yml`          | segundas 05:00 e manual | OWASP ZAP: baseline do frontend e scan activo da API (OpenAPI), numa cópia isolada; relatórios como artefactos |
| `dependabot.yml`   | segundas                | PRs de actualização (npm agrupado; Angular junto) e das GitHub Actions                                         |

O backend tem o seu próprio `ci.yml` (formatação, testes contra MySQL, shellcheck dos scripts de
backup, gitleaks) e `dependabot.yml` (Maven e Actions).

## Configurar uma vez no GitHub

1. **Repositório do backend privado?** O job E2E precisa de o ler:
   - GitHub → Settings → Developer settings → _Fine-grained tokens_ → novo token só com
     acesso ao repositório `ngola-health-backend`, permissão _Contents: Read-only_, validade de 1 ano;
   - no repositório do frontend: Settings → Secrets and variables → Actions → _New repository
     secret_ `BACKEND_REPO_TOKEN` com esse token.
     Se o backend for público, não é preciso.
2. **Proteger o `main`** (nos dois repositórios): Settings → Branches → regra para `main` com
   _Require status checks to pass_ (`Build e testes`, `Segredos no repositório` e, no frontend,
   `Formatação, testes e build` e `Testes E2E (Playwright)`).
3. **Alertas de segurança**: Settings → Code security → activar _Dependabot alerts_, _Secret
   scanning_ e _Code scanning (CodeQL, default setup)_.

Não há segredos reais no CI: a base MySQL é um contentor descartável e o `JWT_SECRET` é gerado
em cada execução.

## Quando algo falha

- **E2E**: descarregue o artefacto `playwright-report` (traces e capturas de cada falha) e abra
  com `npx playwright show-report <pasta>`.
- **Backend**: artefacto `surefire-reports`.
- **gitleaks**: se for um segredo real, **revogue-o primeiro** e só depois limpe o histórico;
  se for um valor de teste, acrescente o caminho a `.gitleaks.toml`.
- **ZAP**: alertas _High_ corrigem-se antes da versão seguinte; os restantes revêem-se e, se
  forem aceites, ficam registados.
