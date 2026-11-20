# Guia da Farmácia

**Utilizador de formação:** `farmacia.demo` (Dr. Bento Farmácia)

## O seu papel

- Manter o **catálogo de medicamentos**.
- **Receber lotes** (entradas de stock) com número de lote e validade.
- **Dispensar** receitas e fazer a **dispensa ao balcão** (só medicamentos de venda livre).
- Vigiar os **alertas**: stock abaixo do mínimo, lotes a expirar e expirados.
- Fazer **acertos** de inventário e **abater** lotes expirados.

**No menu:** Prescrições, Farmácia, Recursos humanos, Equipamentos.

## O seu dia-a-dia

### Dispensar uma receita

**Prescrições** → com **Só por dispensar** (activas e parcialmente dispensadas) → abra a receita
→ **Dispensar** nas linhas a entregar (pode ser uma quantidade parcial).

- O sistema tira o stock do lote **que expira primeiro** e nunca de lotes expirados.
- Não é possível dispensar mais do que o prescrito nem mais do que o stock disponível.
- A receita passa a **parcialmente dispensada** ou **dispensada**.
- Receitas fora da validade (30 dias) não se dispensam.

### Dispensa ao balcão

**Farmácia** → **Dispensa ao balcão** → medicamento, quantidade e, opcionalmente, o doente. Só
para medicamentos **sem receita obrigatória**: os outros são recusados com a indicação "exige
receita".

### Receber um lote

**Farmácia** → abra o medicamento → **Receber lote** → **Número do lote**, **Validade**,
**Quantidade** e fornecedor. Não se aceitam lotes já expirados.

### Alertas de stock

**Farmácia** → **Alertas de stock**, em três listas:

- **Abaixo do stock mínimo**: encomendar.
- **A expirar** nos próximos dias: dar saída primeiro.
- **Expirados com saldo**: **Abater expirado** (sai do stock com registo).

Todas as manhãs a farmácia recebe uma notificação com o resumo destes alertas.

### Acertos de inventário

No medicamento → **Registar acerto** → quantidade (positiva ou negativa) e **Motivo**
(obrigatório), por exemplo após uma contagem física. Fica nos **Movimentos**, com o seu nome.

### Catálogo

**Farmácia** → **Novo medicamento**: nome comercial, DCI, forma farmacêutica, dosagem, unidade de
dispensa, **stock mínimo** (para o alerta) e se **exige receita**.

## Exercícios de formação

| #   | Faça                                                                                                          | Resultado esperado                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Entre com `farmacia.demo` → **Farmácia** → **Alertas de stock**                                               | Vê as três listas com contagens                                                     |
| 2   | Crie o medicamento "Formação 250 mg", comprimido, stock mínimo 20, exige receita                              | Aparece no catálogo                                                                 |
| 3   | Receba o lote L-A, validade daqui a 6 meses, 10 unidades, e o lote L-B, validade daqui a 2 meses, 10 unidades | Stock total 20; dois lotes                                                          |
| 4   | Tente receber um lote com validade de ontem                                                                   | O sistema recusa                                                                    |
| 5   | Dispense uma receita activa (peça uma ao médico do grupo)                                                     | A receita passa a dispensada; nos movimentos, a saída é do lote que expira primeiro |
| 6   | Tente a **dispensa ao balcão** do "Formação 250 mg"                                                           | Recusada: exige receita                                                             |
| 7   | Faça uma dispensa ao balcão de um medicamento de venda livre                                                  | O stock diminui                                                                     |
| 8   | Registe um acerto de −2 com o motivo "contagem física"                                                        | O stock baixa 2; o movimento fica com o motivo                                      |
| 9   | Dispense até o stock ficar abaixo de 20                                                                       | O medicamento aparece em "Abaixo do stock mínimo"                                   |
| 10  | Tente dispensar mais do que o stock disponível                                                                | O sistema recusa                                                                    |

## Problemas frequentes

- **"Stock insuficiente" com lotes na prateleira**: os lotes expirados não contam. Abata-os e
  confirme as validades.
- **Receita não aparece em "por dispensar"**: está dispensada, cancelada ou expirada; desmarque o
  filtro para a ver.
