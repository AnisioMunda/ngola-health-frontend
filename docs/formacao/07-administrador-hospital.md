# Guia do Administrador do hospital

**Utilizador de formação:** `admin.demo` (Administrador Demo)

## O seu papel

- **Contas dos profissionais** do seu hospital: criar, editar perfis, desactivar e repor senhas.
- Tudo o que a **gestão** faz: dashboard, relatórios, horários, enfermarias, RH, equipamentos e
  auditoria ([06-gestao.md](06-gestao.md)).
- **Inactivar fichas de doentes** e gerir o **acesso ao portal** (na ficha do doente: **Desactivar
  acesso** ou **Reactivar acesso**).
- Catálogos: medicamentos da farmácia e exames do laboratório.

Só vê e gere o **seu** hospital.

## O seu dia-a-dia

### Criar a conta de um profissional

**Utilizadores** → **Novo utilizador**:

1. **Identificação**: nome completo, **Nome de utilizador** (para entrar) e correio electrónico.
2. **Perfis**: um ou mais (Médico, Enfermeiro, Recepcionista, Farmacêutico, Técnico de
   laboratório, Gestor, Administrador). O perfil decide o que a pessoa vê e faz (ver a tabela no
   [README](README.md#3-quem-faz-o-quê)).
3. **Dados profissionais**: especialidade e n.º da carteira profissional (médicos).
4. **Senha temporária**: escreva uma ou use **Gerar outra**. Entregue-a à pessoa de forma
   segura. No primeiro acesso, ela é obrigada a escolher uma senha pessoal.

### Problemas de acesso de um profissional

Abra o utilizador → **Segurança da conta** → **Repor senha**. O sistema gera uma senha
temporária, **desbloqueia a conta** e termina as sessões abertas. A senha temporária só é mostrada
uma vez: entregue-a à pessoa de forma segura. No acesso seguinte, a pessoa tem de a mudar.

- **Senha esquecida** ou **conta bloqueada** (5 tentativas erradas): **Repor senha**, ou, no caso
  do bloqueio, esperar 15 minutos.
- **Saída do hospital**: na lista de **Utilizadores**, **Desactivar**. A pessoa deixa de conseguir
  entrar e o histórico fica na auditoria. As contas não se apagam; **Activar** volta a dar
  acesso.

### Princípios a seguir

- Uma pessoa, uma conta. **Nunca** crie contas partilhadas ("enfermagem1").
- Dê só os perfis de que a pessoa precisa para o trabalho.
- Reveja os utilizadores activos todos os meses e desactive quem saiu.

## Exercícios de formação

| #   | Faça                                                                            | Resultado esperado                                                                        |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Entre com `admin.demo` → **Utilizadores**                                       | Lista dos profissionais do Hospital Demo Ngola                                            |
| 2   | Crie o utilizador `formacao.enf` com o perfil Enfermeiro e uma senha temporária | A conta aparece na lista                                                                  |
| 3   | Noutra janela (privada), entre com `formacao.enf` e a senha temporária          | O sistema obriga a mudar a senha antes de continuar                                       |
| 4   | Com `formacao.enf`, erre a senha 5 vezes                                        | Aparece a indicação de conta bloqueada                                                    |
| 5   | Com `admin.demo`, abra `formacao.enf` → **Repor senha**                         | Aparece a nova senha temporária; `formacao.enf` volta a conseguir entrar e tem de a mudar |
| 6   | Acrescente o perfil Recepcionista a `formacao.enf`                              | Depois de voltar a entrar, o menu mostra também o Agendamento                             |
| 7   | Na lista, **Desactivar** `formacao.enf`                                         | A pessoa já não consegue entrar                                                           |
| 8   | **Auditoria** → filtre pelo registo do utilizador `formacao.enf`                | Aparecem a criação, as alterações, o bloqueio e a desactivação                            |
| 9   | Inactive a ficha de um doente de teste                                          | Deixa de aparecer na pesquisa por omissão; continua em "Inactivos"                        |
| 10  | Faça os exercícios do guia da gestão                                            | Os mesmos resultados                                                                      |
