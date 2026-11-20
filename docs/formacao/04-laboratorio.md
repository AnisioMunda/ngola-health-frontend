# Guia do Laboratório

**Utilizador de formação:** `lab.demo` (Téc. Lurdes Laboratório)

## O seu papel

- Receber os **pedidos de exames** dos médicos.
- Registar a **colheita** das amostras.
- **Analisar**, registar e **validar** os resultados.
- **Corrigir** resultados já validados, sempre com o motivo.
- Manter o **catálogo de exames** (valores de referência, unidades).

**No menu:** Laboratório, Recursos humanos, Equipamentos.

## O seu dia-a-dia

### A lista de trabalho

**Laboratório** com **Só por concluir** marcado: pedidos por colher, colhidos e em análise. Os
**urgentes** aparecem primeiro e, dentro de cada prioridade, os mais antigos. Sem **Só por
concluir**, vê o histórico, com os mais recentes primeiro. Pode pesquisar pelo número do pedido.

### Fases de um pedido

```
Pendente ──► Colhido ──► Em análise ──► Concluído
                         (cada exame: Pendente → Por validar → Validado)
```

1. **Registar colheita**, com notas se necessário (por exemplo, "amostra hemolisada").
2. **Iniciar análise**.
3. Em cada exame, escreva o **valor** (numérico) ou o **resultado** (texto; marque **Alterado** se
   for o caso) → **Guardar**. O estado passa a **Por validar**.
4. **Validar**. Só nesta altura o resultado fica visível para o médico e para o doente no portal.
   O pedido fica **Concluído** quando todos os exames estão validados.

O sistema compara automaticamente os valores numéricos com a referência do catálogo e assinala
**Baixo ↓** ou **Alto ↑**. Um resultado validado alterado gera uma notificação de prioridade alta
ao médico.

### Corrigir um resultado validado

No exame validado → **Corrigir** → novo valor e **motivo da correcção** (obrigatório) → **Corrigir
resultado**. O valor antigo fica guardado no histórico e o médico é avisado.

### Catálogo de exames

**Laboratório** → **Catálogo de exames** → **Novo exame** ou **Editar**: código, nome, categoria,
tipo de resultado (numérico ou texto), unidade e valores de referência.

## Exercícios de formação

Antes de começar, peça ao médico do grupo (ou ao formador, com `medico.demo`) que peça um exame
**urgente** e um de **rotina**.

| #   | Faça                                                                                    | Resultado esperado                                                   |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Entre com `lab.demo` → **Laboratório**, **Só por concluir**                             | O pedido urgente está acima do de rotina                             |
| 2   | Abra o pedido urgente → **Registar colheita** com a nota "colheita sem intercorrências" | Aparece "Colheita … por Téc. Lurdes Laboratório"                     |
| 3   | **Iniciar análise**                                                                     | Os exames ficam editáveis                                            |
| 4   | Escreva um valor **normal** num exame numérico → **Guardar**                            | Estado "Por validar"; indicação Normal                               |
| 5   | **Validar**                                                                             | Estado "Validado"; o médico recebe a notificação de resultado pronto |
| 6   | No pedido de rotina, registe um valor **acima** da referência e valide                  | Aparece "Alto ↑"; o médico recebe um alerta de resultado alterado    |
| 7   | **Corrija** esse resultado com o motivo "erro de transcrição"                           | O novo valor aparece e o histórico guarda o antigo                   |
| 8   | Tente validar sem ter guardado um valor                                                 | O botão Validar não está disponível                                  |
| 9   | Desmarque **Só por concluir**                                                           | Vê o histórico, com os mais recentes primeiro                        |
| 10  | No catálogo, edite a unidade de um exame                                                | A alteração aplica-se aos pedidos novos                              |

## Problemas frequentes

- **O médico diz que não vê o resultado**: confirme que carregou em **Validar**; "Por validar"
  ainda não é visível.
- **Pedido cancelado pelo médico**: deixa de aparecer na lista de trabalho; o histórico mostra o
  motivo.
