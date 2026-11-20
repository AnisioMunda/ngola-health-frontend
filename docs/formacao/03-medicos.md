# Guia dos Médicos

**Utilizadores de formação:** `medico.demo` (Dr. Paulo Neto, Medicina Interna) e `medica.demo`
(Dra. Helena Kiala, Pediatria)

## O seu papel

- Atender os doentes nos **episódios** (consultas, urgências, exames): anamnese, diagnóstico e
  conclusão.
- **Pedir exames** ao laboratório e ver os resultados validados.
- **Prescrever** (receitas).
- **Internar** e **dar alta**.
- Triar e chamar doentes da urgência, como a enfermagem.
- Registar as suas **ausências** na agenda.

**No menu:** Pacientes, Agendamento, Triagem, Episódios, Internamento, Prescrições, Laboratório,
Farmácia (consulta), Recursos humanos, Equipamentos.

## O seu dia-a-dia

### A minha lista de trabalho

**Episódios** → vista dos abertos (agendados e em curso), por ordem de hora. Pode filtrar por dia
e ver só os seus. Os episódios chegam:

- da **recepção** (consulta marcada, chegada registada);
- da **triagem** (episódio de urgência);
- criados por si: **Novo episódio**.

### Atender um episódio

Abra o episódio:

1. **Iniciar**: o episódio passa a "em curso".
2. **Sinais vitais**: se a enfermagem ainda não os registou.
3. **Informação clínica**: **Anamnese** e **Diagnóstico** → **Guardar**.
4. **Exames** e **Prescrições**: ver as secções seguintes.
5. **Concluir** quando terminar. Para desistir de um episódio, use **Cancelar episódio**, com o
   motivo.

### Pedir exames

No episódio em curso → **Exames** → **Pedir exames** → escolha os exames do catálogo, a
prioridade (**rotina** ou **urgente**) e a informação clínica → confirme.

- **Só vê o resultado depois de o laboratório o validar.**
- Recebe uma **notificação** quando o resultado fica pronto e outra, de prioridade alta, se vier
  **alterado** (abaixo ou acima da referência).
- Se o laboratório corrigir um resultado já validado, também é avisado, e fica registado o
  valor antigo e o motivo da correcção.

### Prescrever

No episódio em curso → **Prescrições** → **Nova prescrição** → para cada medicamento: **Dose**,
**Via**, frequência, **Duração (dias)** e **Instruções** → confirme.

- A receita recebe um número e é válida durante 30 dias.
- Pode **Imprimir** para entregar ao doente.
- A farmácia dispensa a partir da receita; o estado mostra se já foi dispensada, total ou
  parcialmente.

### Internar e dar alta

- **Internar**: no episódio → **Internar** → escolha a enfermaria, uma cama livre, o médico
  responsável e o motivo. Um doente só pode ter um internamento activo, e uma cama só tem um
  doente.
- **Dar alta**: abra o internamento → **Dar alta** → **Estado à saída** (incluindo óbito),
  **Diagnóstico final** e **Resumo da alta** → **Confirmar alta**. A cama fica livre.

### Ausências

**Agendamento** → **Horários e ausências** → **Registar ausência** (dia ou horas). As vagas
desse período deixam de estar disponíveis para marcação. As consultas que já estavam marcadas
nesse período mantêm-se e aparecem listadas como afectadas: avise a recepção para as remarcar.

## Exercícios de formação

| #   | Faça                                                          | Resultado esperado                                                                       |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Entre com `medico.demo` → **Episódios**, vista dos seus       | Vê os episódios do dia do Dr. Paulo Neto                                                 |
| 2   | **Novo episódio** de consulta para um doente → **Iniciar**    | Estado "em curso"                                                                        |
| 3   | Registe anamnese e diagnóstico → **Guardar**                  | Os textos ficam gravados com a hora                                                      |
| 4   | Peça um exame **urgente**                                     | O pedido aparece no Laboratório, com número                                              |
| 5   | Depois do exercício do laboratório (guia 04), abra o episódio | O resultado aparece validado; recebeu uma notificação                                    |
| 6   | Prescreva paracetamol 500 mg, oral, 8/8h, 5 dias              | A receita fica activa, com número e validade de 30 dias                                  |
| 7   | **Imprima** a receita                                         | Abre a versão para imprimir                                                              |
| 8   | Interne um doente numa cama livre                             | A cama passa a ocupada no mapa de camas                                                  |
| 9   | Tente internar o mesmo doente outra vez                       | O sistema recusa (já tem um internamento activo)                                         |
| 10  | Dê alta com o estado "melhorado"                              | A cama fica livre; o internamento mostra a alta                                          |
| 11  | **Conclua** o episódio                                        | O episódio sai da lista dos abertos                                                      |
| 12  | Registe uma ausência amanhã das 08:00 às 10:00                | Aparecem as marcações afectadas (se houver); na marcação, essas vagas deixam de aparecer |

## Problemas frequentes

- **Não consigo pedir exames nem prescrever**: o episódio tem de estar **em curso** (carregue em
  **Iniciar**).
- **O resultado ainda não aparece**: o laboratório ainda não validou. O pedido mostra em que
  fase está.
