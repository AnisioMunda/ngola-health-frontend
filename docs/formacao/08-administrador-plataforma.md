# Guia do Administrador da plataforma

**Utilizador de formação:** `platform-admin`

## O seu papel

- Registar e gerir os **hospitais** que usam a plataforma.
- Criar o **primeiro administrador** de cada hospital; daí em diante, cada hospital gere as suas
  contas.
- Acompanhar o **estado do sistema** (base de dados, erros, logins, tarefas automáticas).
- Consultar a **auditoria** de todos os hospitais.

**Não tem acesso a dados clínicos** (doentes, episódios, receitas): esses dados pertencem a cada
hospital.

**No menu:** Hospitais, Utilizadores, Auditoria, Estado do sistema.

## O seu dia-a-dia

### Registar um hospital

**Hospitais** → **Registar hospital** → **Nome da instituição**, **Código** (único, por exemplo
`HCL-001`), **Tipo**, **Província**, município, morada, contactos e NIF → registar. Depois, em
**Utilizadores**, crie o administrador desse hospital (perfil Administrador, escolhendo o
hospital).

Um hospital **desactivado** deixa de permitir a entrada dos seus profissionais. Os dados ficam
guardados.

### Estado do sistema

**Estado do sistema** actualiza-se sozinho a cada 30 segundos:

- **Base de dados**: disponível e tempo de resposta.
- **Em funcionamento há**: desde o último arranque do servidor.
- **Sessões activas**, **pedidos à API**, **erros do servidor (5xx)** e **logins falhados**.
  Ficam destacados quando há erros ou contas bloqueadas.
- **Recursos**: memória, disco, ligações à base de dados e processador.
- **Tarefas agendadas**: resumo diário da farmácia, lembretes da agenda, manutenções, limpezas.
  Mostra a próxima execução e o resultado da última.

Sinais de alerta: base de dados **Indisponível**, erros 5xx a subir, muitos logins falhados (pode
ser alguém a tentar adivinhar senhas), disco quase cheio, ou uma tarefa **Falhou**.

## Exercícios de formação

| #   | Faça                                                                   | Resultado esperado                                                        |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Entre com `platform-admin` (na primeira vez, mude a senha)             | Página inicial com Hospitais, Utilizadores, Auditoria e Estado do sistema |
| 2   | Registe o hospital "Clínica Formação", código `FOR-001`, Luanda        | Aparece na lista de hospitais                                             |
| 3   | Tente registar outro hospital com o código `FOR-001`                   | O sistema recusa (código repetido)                                        |
| 4   | Crie o administrador `admin.formacao` da Clínica Formação              | Consegue entrar e só vê a Clínica Formação                                |
| 5   | Com `admin.formacao`, procure doentes do Hospital Demo Ngola           | Não aparecem (cada hospital só vê os seus dados)                          |
| 6   | Abra **Estado do sistema**                                             | Base de dados "Disponível"; tarefas agendadas listadas                    |
| 7   | Noutra janela, erre a senha de um utilizador 2 vezes e volte ao estado | O contador "Logins falhados" sobe                                         |
| 8   | Desactive a Clínica Formação e tente entrar com `admin.formacao`       | Entrada recusada (hospital inactivo)                                      |
| 9   | **Auditoria** → filtre por hospital                                    | Vê os eventos de cada hospital                                            |
