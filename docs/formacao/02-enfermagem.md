# Guia da Enfermagem

**Utilizadores de formação:** `enfermeira.demo` (Enf. Rosa Cassoma) e `enfermeiro.demo` (Enf.
Mateus Lumbo)

## O seu papel

- **Triagem** da urgência pelo protocolo de Manchester: atribuir a prioridade e gerir a fila.
- Registar **sinais vitais** nos episódios.
- **Colheita** de amostras para o laboratório.
- No internamento: **mudar o doente de cama** e pôr camas em manutenção.
- Também pode registar doentes e marcar consultas, como a recepção.

**No menu:** Pacientes, Agendamento, Triagem, Episódios, Internamento, Prescrições (consulta),
Laboratório, Farmácia (consulta), Recursos humanos, Equipamentos.

## O seu dia-a-dia

### Triar um doente

**Triagem** → **Nova triagem**.

1. **Doente**:
   - **Paciente registado**: pesquise e escolha;
   - **Provisório (identificar depois)**: para quem chega sem documentos ou inconsciente. Indique
     um nome provisório, a idade aproximada e o sexo.
2. **Prioridade**:

   | Cor      | Significado   | Tempo-alvo até ser chamado |
   | -------- | ------------- | -------------------------- |
   | Vermelho | Imediato      | 0 min                      |
   | Laranja  | Muito urgente | 10 min                     |
   | Amarelo  | Urgente       | 60 min                     |
   | Verde    | Pouco urgente | 120 min                    |
   | Azul     | Não urgente   | 240 min                    |

3. **Queixa principal** (obrigatória), dor de 0 a 10 e sinais vitais.
4. **Registar e atribuir senha**: o doente recebe o número da fila do dia.

### Gerir a fila

**Triagem** mostra **Em espera** (ordenada por prioridade e depois por hora de chegada) e **Em
atendimento**. Os doentes **Fora do tempo-alvo** ficam assinalados.

- **Chamar**: o doente passa a "em atendimento".
- **Alterar prioridade** (re-triagem): se o estado mudou, com o motivo.
- **Identificar doente**: liga uma triagem provisória à ficha do paciente.
- **Abrir episódio de urgência** ou **Concluir sem episódio**.
- **Saiu sem ser atendido**: quando o doente abandona a urgência.

### Sinais vitais num episódio

**Episódios** → abra o episódio → se ainda estiver agendado, **Iniciar** → **Sinais vitais** →
preencha TA, FC, FR, temperatura, SpO₂, peso e altura → **Guardar**. Os sinais vitais só se
registam com o episódio em curso.

### Colheita de amostras

**Laboratório** → abra o pedido → **Notas da colheita** (opcional) → **Registar colheita**.

### Internamento

- **Mudar de cama**: Internamento → abra o internamento → **Transferir de cama ou enfermaria**.
  Indique a nova cama (tem de estar livre) e o motivo.
- **Cama em manutenção**: no mapa de camas, ponha a cama em **Manutenção** (avaria, limpeza) e
  volte a **Cama livre** quando estiver pronta.

## Exercícios de formação

| #   | Faça                                                                                                                       | Resultado esperado                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Entre com `enfermeira.demo`                                                                                                | Página inicial; o menu tem Triagem e Laboratório                                    |
| 2   | Nova triagem de um doente **provisório** "Desconhecido Formação", ~40 anos, prioridade **Vermelho**, queixa "dor torácica" | Mensagem "Senha N atribuída a Desconhecido Formação"; o doente fica no topo da fila |
| 3   | Nova triagem de um doente registado, prioridade **Verde**                                                                  | Fica abaixo dos vermelhos e laranjas                                                |
| 4   | Altere a prioridade do doente verde para **Amarelo**, com motivo                                                           | Sobe na fila; o histórico mostra a alteração                                        |
| 5   | **Chame** o doente vermelho                                                                                                | Passa para "Em atendimento"                                                         |
| 6   | **Identifique** o doente provisório, ligando-o a uma ficha existente                                                       | A triagem passa a mostrar o nome verdadeiro                                         |
| 7   | Abra um episódio agendado, **Iniciar**, e registe os sinais vitais                                                         | Os valores ficam no episódio, com a hora e o seu nome                               |
| 8   | Em Laboratório, registe a colheita de um pedido pendente                                                                   | O pedido passa a "colhido" e mostra quem colheu e quando                            |
| 9   | No internamento, transfira um doente para uma cama livre                                                                   | A cama antiga fica livre e a nova ocupada; aparece em "Mudanças de cama"            |
| 10  | Tente transferir para uma cama ocupada                                                                                     | O sistema recusa                                                                    |

## Problemas frequentes

- **Não consigo registar anamnese nem diagnóstico**: é tarefa do médico.
- **Não consigo internar**: o internamento é decidido pelo médico.
