# Guia da Recepção

**Utilizador de formação:** `recepcao.demo` (Celeste Recepção)

## O seu papel

É a porta de entrada do doente. A recepção:

- regista os doentes novos e mantém as fichas actualizadas;
- marca, confirma, remarca e cancela consultas;
- regista a chegada do doente, o que abre o episódio para a enfermagem e o médico;
- dá ao doente o código de acesso ao portal do paciente;
- na urgência, assinala o doente que saiu sem ser atendido.

**No menu:** Pacientes, Agendamento, Triagem, Episódios, Internamento (consulta), Recursos
humanos, Equipamentos.

## O seu dia-a-dia

### Encontrar um doente

**Pacientes** → no campo **Pesquisar** escreva o nome, o número de processo, o BI ou o telefone
→ Enter.

- A pesquisa não distingue acentos nem maiúsculas.
- **Pesquise sempre antes de registar**, para não criar um segundo processo para a mesma pessoa.

### Registar um doente novo

**Pacientes** → **Registar paciente**.

1. Obrigatórios: **Nome completo**, **Data de nascimento** e **Género**.
2. Recomendados: BI / NIF, telefone, contacto de emergência e alergias.
3. **Registar paciente**. O número de processo é atribuído automaticamente.

Se aparecer **"Possível paciente já registado"**, o sistema encontrou alguém com o mesmo BI, o
mesmo telefone, ou a mesma data de nascimento com um nome parecido. Abra o processo indicado e
confirme se é a mesma pessoa:

- **Rever dados**: volta ao formulário; use o processo que já existe.
- **É outra pessoa, registar**: só se tiver a certeza de que são pessoas diferentes.

### Marcar uma consulta

**Agendamento** → **Nova marcação**.

1. Escolha o doente (**Trocar** se se enganou).
2. Escolha o médico e o dia; aparecem as vagas livres do horário do médico.
3. Escolha a vaga, o tipo (consulta, seguimento, exame) e o motivo → confirme.

Regras:

- Só aparecem vagas dentro do horário do médico e fora das suas ausências.
- Não é possível marcar duas consultas à mesma hora para o mesmo doente.
- As marcações aceitam-se até 180 dias no futuro.

### No dia da consulta

**Agendamento** → **Agenda** (por omissão, a de hoje) → abra a marcação:

- **Confirmar**: o doente confirmou que vem.
- **Registar chegada**: o doente chegou. Abre-se o **episódio** e o médico vê-o na lista de
  trabalho.
- **Faltou**: o doente não veio.
- **Remarcar**: escolha nova data e vaga; a marcação antiga fica ligada à nova.
- **Cancelar marcação**: indique o motivo.

### Dar acesso ao portal do paciente

Ficha do doente → secção **Portal do paciente**.

1. **Confirme a identidade do doente** (BI ou outro documento).
2. **Gerar código de activação**. O código só aparece uma vez: entregue-o ao doente (em papel).
3. Explique ao doente: entra no endereço indicado no ecrã, escolhe **Activar a minha conta** e
   usa o código e a data de nascimento.

O código é válido durante 3 dias. Ao fim de 5 tentativas com a data errada deixa de funcionar:
gere um novo.

### Urgência: doente que saiu sem ser atendido

**Triagem** → na fila, no doente em espera → **Saiu**.

## Exercícios de formação

| #   | Faça                                                                       | Resultado esperado                                                                    |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Entre com `recepcao.demo` e escreva a senha errada 1 vez                   | Mensagem "Utilizador ou senha incorrectos."                                           |
| 2   | Entre com a senha certa                                                    | Página inicial "Olá, Celeste Recepção"; o menu **não** tem Auditoria nem Utilizadores |
| 3   | Registe a doente _Formação Recepção Silva_, nascida a 10/03/1990, feminino | Abre a ficha com o número de processo                                                 |
| 4   | Pesquise "formacao recepcao" (sem acentos)                                 | A doente aparece na lista                                                             |
| 5   | Tente registar outra vez a mesma doente, com a mesma data                  | Aparece "Possível paciente já registado"; carregue em **Rever dados**                 |
| 6   | Marque-lhe uma consulta para amanhã com o Dr. Paulo Neto                   | A marcação aparece na agenda de amanhã                                                |
| 7   | Tente marcar outra consulta à mesma hora para a mesma doente               | O sistema recusa                                                                      |
| 8   | Remarque a consulta para depois de amanhã                                  | A marcação antiga fica remarcada e a nova aparece na agenda                           |
| 9   | Marque uma consulta para hoje e registe a chegada                          | Abre-se o episódio; aparece em **Episódios**                                          |
| 10  | Gere o código do portal para a doente                                      | Aparece o código e a validade; o estado passa a "código entregue"                     |
| 11  | Escreva `/audit` na barra de endereço                                      | Volta à página inicial (sem acesso)                                                   |
| 12  | Carregue em **Sair**                                                       | Volta ao ecrã de login                                                                |

## Problemas frequentes

- **"Não aparecem vagas"**: o médico não tem horário nesse dia ou registou uma ausência. Fale com
  a gestão.
- **"Conta bloqueada"**: espere 15 minutos ou peça ao administrador do hospital.
- **O doente perdeu o código do portal** (ainda não activou a conta): gere um novo; o anterior
  deixa de valer.
- **O doente já activou a conta e esqueceu-se da senha**: ainda não há recuperação de senha do
  portal. Encaminhe ao administrador do hospital.
