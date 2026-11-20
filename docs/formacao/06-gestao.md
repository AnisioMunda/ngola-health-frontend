# Guia da Gestão (direcção e chefias)

**Utilizador de formação:** `gestor.demo` (Graça Gestora)

## O seu papel

- Acompanhar os **indicadores** do hospital (Dashboard) e os **relatórios**.
- Gerir os **horários dos médicos** (agenda).
- Gerir **enfermarias e camas**.
- **Recursos humanos**: marcar turnos, aprovar ou recusar férias e folgas, corrigir registos de
  ponto.
- **Equipamentos**: inventário, manutenções e avarias.
- Consultar a **auditoria** e os utilizadores.

A gestão vê os dados clínicos em modo de consulta, mas não regista actos clínicos.

## O seu dia-a-dia

### Dashboard

**Dashboard** → escolha o período (por omissão, os últimos 30 dias):

- **Atendimento**: episódios por tipo e estado; triagens por prioridade, espera média e % dentro
  do tempo-alvo; marcações e taxa de faltas.
- **Internamento e laboratório**: ocupação de camas, entradas, altas, demora média, tempo de
  resposta do laboratório e % de resultados alterados.
- **Farmácia**: medicamentos abaixo do mínimo, lotes a expirar e expirados.

Cada gráfico tem uma vista em tabela. Períodos longos (um ano) demoram alguns segundos a
calcular.

### Relatórios

**Relatórios** → ocupação por enfermaria no período (camas, entradas, altas, dias-cama, taxa de
ocupação, demora média) → **Exportar CSV** para abrir no Excel.

### Horários dos médicos

**Agendamento** → **Horários e ausências** → **Criar horário**: médico, dia da semana, das …
às …, duração das vagas e número de doentes por vaga. **Desactivar** um horário não apaga as
marcações já feitas.

### Enfermarias e camas

**Internamento** → **Gerir enfermarias** → criar ou editar enfermarias (nome, código, piso, tipo)
e **Adicionar** camas.

### Recursos humanos

**Recursos humanos**:

- **Escala** → **Marcar turno** (profissional, início, fim, enfermaria) e **Copiar para a semana
  seguinte**. Não se marcam turnos sobrepostos nem durante férias aprovadas.
- **Folgas e férias** → **Por decidir** → **Aprovar** ou **Recusar**. Se o pedido coincidir com
  turnos marcados, use **Aprovar e cancelar os turnos**. Ninguém aprova os seus próprios pedidos.
- **Registos de ponto** → **Corrigir** (com o motivo) quando alguém se esqueceu de registar a
  entrada ou a saída. Ninguém corrige o seu próprio ponto.
- O painel mostra os profissionais **em turno agora**, os **atrasos**, as **faltas** e os
  **pedidos por decidir**.

### Equipamentos

**Equipamentos** → **Novo equipamento** (código de inventário, categoria, **criticidade**,
localização e datas de manutenção e calibração).

- **Avarias abertas**: **Enviar para manutenção**, **Registar manutenção** com o resultado, ou
  **Descartar** (avaria sem fundamento).
- Uma avaria de criticidade **alta** põe o equipamento logo **fora de serviço**, e a gestão é
  notificada.
- **Manutenções a vencer**: todas as manhãs recebe o resumo das manutenções e calibrações em
  atraso ou a vencer em 30 dias.
- **Abater**: equipamento retirado de uso.

### Auditoria

**Auditoria** → filtre por acção, registo, resultado, período ou pesquise por utilizador. Cada
linha diz quem fez, o quê, quando e o que mudou.

## Exercícios de formação

| #   | Faça                                                                                | Resultado esperado                                            |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Entre com `gestor.demo` → **Dashboard**                                             | Indicadores dos últimos 30 dias, com gráficos                 |
| 2   | Mude o período para os últimos 7 dias                                               | Os números e gráficos actualizam-se                           |
| 3   | **Relatórios** → **Exportar CSV**                                                   | Descarrega `ocupacao_….csv`                                   |
| 4   | Crie um horário para a Dra. Helena Kiala às quartas, 08:00–12:00, vagas de 30 min   | Na **Nova marcação** aparecem vagas às quartas                |
| 5   | Crie a enfermaria "Formação", com 2 camas                                           | Aparece no mapa de camas, com as camas livres                 |
| 6   | Marque um turno para a Enf. Rosa amanhã das 08:00 às 16:00                          | Aparece na escala                                             |
| 7   | Tente marcar outro turno sobreposto para a mesma pessoa                             | O sistema recusa                                              |
| 8   | Aprove um pedido de férias de outro profissional (crie-o antes com esse utilizador) | O pedido fica aprovado; o profissional é notificado           |
| 9   | Corrija um registo de ponto de outra pessoa, com motivo                             | A correcção fica registada com o seu nome                     |
| 10  | Registe um equipamento de criticidade **alta** e reporte uma avaria                 | O equipamento passa a "fora de serviço"; recebe a notificação |
| 11  | Registe a manutenção dessa avaria com resultado **aprovado**                        | O equipamento volta a "operacional" e a avaria fica resolvida |
| 12  | **Auditoria** → procure as acções dos exercícios 4 a 11                             | Aparecem todas, com o seu nome                                |
