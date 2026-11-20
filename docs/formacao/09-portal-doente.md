# Guia do Portal do paciente

**Utilizador de formação:** `doente.demo`

Este guia serve para o pessoal da recepção explicar o portal ao doente, e para treinar o
atendimento de dúvidas.

## O que o doente pode fazer

- Ver as **consultas** marcadas e as anteriores, e **cancelar** uma consulta futura ("Não posso
  ir"), indicando o motivo.
- Ver os **resultados** de exames, só depois de validados pelo laboratório, com a referência e a
  indicação de alterado.
- Ver as **receitas** e o que falta levantar.
- Ver as **notificações** e mudar a senha.

O doente **só vê os seus próprios dados** e não entra nas áreas do pessoal. O pessoal do
hospital também não entra no portal com a sua conta profissional.

## Activar a conta (primeira vez)

1. Na recepção, o doente recebe um **código de activação**, depois de confirmar a identidade.
2. No ecrã de entrada, o doente carrega em **Activar a minha conta**.
3. Escreve o **Código de activação** e a **Data de nascimento**, escolhe o **nome de utilizador**
   (para entrar), o correio electrónico e a **senha** (10 a 64 caracteres, com minúsculas,
   maiúsculas e números).
4. Daí em diante, entra como qualquer utilizador, no ecrã de login.

O código vale 3 dias e deixa de funcionar ao fim de 5 tentativas com a data de nascimento
errada. Nesse caso, a recepção gera um novo.

## Exercícios de formação

| #   | Faça                                                                                                       | Resultado esperado                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Entre com `doente.demo`                                                                                    | Abre o portal: "Olá, …", próxima consulta, últimos resultados, receitas por levantar |
| 2   | **Resultados**                                                                                             | Só aparecem os exames validados; os que estão em curso aparecem como "por concluir"  |
| 3   | **Consultas** → numa consulta futura, **Não posso ir**, com motivo                                         | A consulta passa a cancelada; o médico é avisado                                     |
| 4   | **Receitas** → **Imprimir**                                                                                | Abre a versão para imprimir                                                          |
| 5   | Escreva `/patients` na barra de endereço                                                                   | Volta ao portal (sem acesso às áreas do pessoal)                                     |
| 6   | Recepção: gere um código para um doente novo; doente: active a conta com uma data de nascimento **errada** | Activação recusada                                                                   |
| 7   | Active com a data certa                                                                                    | Entra no portal com o novo utilizador                                                |

## Dúvidas frequentes dos doentes

- **"O resultado ainda não aparece"**: o laboratório ainda não o validou.
- **"Esqueci-me da senha"**: por agora o sistema não tem recuperação de senha do portal. O
  código de activação só se gera para quem ainda não tem conta. Encaminhe o caso ao
  administrador do hospital.
- **"Quero marcar uma consulta"**: as marcações fazem-se na recepção ou por telefone; no portal
  só se cancela.
