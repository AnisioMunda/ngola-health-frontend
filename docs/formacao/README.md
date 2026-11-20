# Ngola Health — Guia de formação

Este guia explica como funciona o sistema, quem faz o quê e como cada profissional aprende a
usá-lo. Há um guia próprio para cada perfil, com as tarefas do dia-a-dia e exercícios práticos
para fazer durante a formação.

| Perfil                                                 | Guia                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Recepção                                               | [01-recepcao.md](01-recepcao.md)                                 |
| Enfermagem                                             | [02-enfermagem.md](02-enfermagem.md)                             |
| Médicos                                                | [03-medicos.md](03-medicos.md)                                   |
| Laboratório                                            | [04-laboratorio.md](04-laboratorio.md)                           |
| Farmácia                                               | [05-farmacia.md](05-farmacia.md)                                 |
| Gestão (direcção, chefias)                             | [06-gestao.md](06-gestao.md)                                     |
| Administrador do hospital                              | [07-administrador-hospital.md](07-administrador-hospital.md)     |
| Administrador da plataforma                            | [08-administrador-plataforma.md](08-administrador-plataforma.md) |
| Doente (portal do paciente)                            | [09-portal-doente.md](09-portal-doente.md)                       |
| Todos os profissionais: ponto, escala, férias, avarias | [10-todos-rh-equipamentos.md](10-todos-rh-equipamentos.md)       |
| Formador: preparar o ambiente de formação              | [11-formador.md](11-formador.md)                                 |

---

## 1. O que é o Ngola Health

Um sistema de gestão hospitalar que acompanha o doente da chegada à alta: registo, marcação de
consultas, triagem da urgência, consulta médica, exames de laboratório, receitas, farmácia e
internamento. Tem também recursos humanos (ponto, escala, férias), equipamentos (avarias e
manutenções), indicadores para a direcção e um **portal do paciente**, onde o doente vê as suas
consultas, resultados e receitas.

Vários hospitais podem usar a mesma plataforma. **Cada hospital só vê os seus dados**: um
profissional do Hospital A nunca vê doentes do Hospital B.

## 2. O percurso do doente

```
 Recepção              Enfermagem / Médico          Laboratório / Farmácia        Internamento
 ────────              ───────────────────          ──────────────────────        ────────────
 Registar doente  ──►  Triagem (urgência)      ──►  Colheita e análise      ──►   Internar
 Marcar consulta  ──►  Episódio (consulta):         Validar resultado             Mudar de cama
 Registar chegada      sinais vitais, anamnese,     Dispensar a receita           Dar alta
                       diagnóstico, exames,
                       receita, concluir
```

1. **Recepção** regista o doente (ou encontra-o, se já existir) e marca a consulta. No dia, regista
   a chegada, o que abre o **episódio** (o registo daquele atendimento).
2. **Urgência**: a enfermagem faz a **triagem** (Manchester: vermelho, laranja, amarelo, verde,
   azul) e o doente entra na fila. O médico chama-o e abre um episódio de urgência.
3. **Médico**: no episódio regista anamnese e diagnóstico, pede **exames** e passa **receitas**.
4. **Laboratório**: colhe a amostra, analisa, regista e **valida** o resultado. Só então o médico
   (e o doente, no portal) o vêem.
5. **Farmácia**: dispensa a receita, lote a lote (o que expira primeiro sai primeiro).
6. **Internamento**: o médico interna o doente numa cama, pode transferi-lo e dá a alta.

Cada passo avisa quem tem de agir a seguir, através das **notificações** (o sino no topo do ecrã):
por exemplo, o médico é avisado quando um resultado fica validado ou vem alterado.

## 3. Quem faz o quê

✅ pode fazer · 👁 só consulta · — sem acesso

| Área                                          | Recepção | Enfermagem          | Médico    | Laboratório | Farmácia | Gestão | Admin. hospital  |
| --------------------------------------------- | -------- | ------------------- | --------- | ----------- | -------- | ------ | ---------------- |
| Pacientes: registar, editar                   | ✅       | ✅                  | ✅        | —           | —        | 👁      | ✅ (e inactivar) |
| Agendamento: marcar, confirmar, chegada       | ✅       | ✅                  | ✅        | —           | —        | 👁      | ✅               |
| Horários dos médicos                          | 👁        | 👁                   | ausências | —           | —        | ✅     | ✅               |
| Triagem: registar, chamar, re-triar           | ausência | ✅                  | ✅        | —           | —        | 👁      | 👁                |
| Episódios: sinais vitais                      | —        | ✅                  | ✅        | —           | —        | 👁      | 👁                |
| Episódios: anamnese, diagnóstico, concluir    | —        | —                   | ✅        | —           | —        | 👁      | 👁                |
| Pedir exames                                  | —        | —                   | ✅        | —           | —        | —      | —                |
| Colheita de amostras                          | —        | ✅                  | —         | ✅          | —        | —      | —                |
| Análise e validação de resultados             | —        | —                   | —         | ✅          | —        | —      | —                |
| Receitas: prescrever                          | —        | —                   | ✅        | —           | —        | —      | —                |
| Farmácia: stock, lotes, dispensa              | —        | 👁                   | 👁         | —           | ✅       | 👁      | 👁 (e catálogo)   |
| Internamento: internar, dar alta              | 👁        | mudar de cama       | ✅        | —           | —        | 👁      | 👁                |
| Enfermarias e camas                           | —        | manutenção de camas | —         | —           | —        | ✅     | ✅               |
| Ponto, escala, férias (o próprio)             | ✅       | ✅                  | ✅        | ✅          | ✅       | ✅     | ✅               |
| Aprovar férias, marcar turnos, corrigir ponto | —        | —                   | —         | —           | —        | ✅     | ✅               |
| Reportar avarias                              | ✅       | ✅                  | ✅        | ✅          | ✅       | ✅     | ✅               |
| Gerir equipamentos e manutenções              | —        | —                   | —         | —           | —        | ✅     | ✅               |
| Dashboard e relatórios                        | —        | —                   | —         | —           | —        | ✅     | ✅               |
| Utilizadores                                  | —        | —                   | —         | —           | —        | 👁      | ✅               |
| Auditoria                                     | —        | —                   | —         | —           | —        | ✅     | ✅               |

O **administrador da plataforma** regista hospitais, cria os primeiros administradores de cada
hospital e acompanha o estado do sistema. Não tem acesso aos dados clínicos.

O **doente** só entra no portal do paciente e só vê os seus próprios dados.

## 4. Regras gerais (valem para todos)

- **Entrar**: com o nome de utilizador (ou o correio electrónico) e a senha.
- **Primeira vez**: a conta é criada com uma senha temporária, e o sistema obriga a escolher uma
  senha pessoal antes de continuar.
- **Senha**: entre 10 e 64 caracteres, com minúsculas, maiúsculas e números. É pessoal: nunca a
  partilhe nem use a conta de um colega.
- **Bloqueio**: 5 tentativas erradas seguidas bloqueiam a conta durante 15 minutos.
- **Sessão**: termina sozinha ao fim de algum tempo sem uso. Num computador partilhado, carregue
  sempre em **Sair**.
- **O menu mostra só o que o seu perfil pode usar.** Se uma área não aparece, não tem acesso a
  ela. Peça ao administrador do hospital se achar que devia ter.
- **Tudo fica registado**: cada acção (quem, o quê, quando) fica na auditoria. Os registos
  clínicos não se apagam; corrigem-se ou anulam-se com o motivo indicado.
- **Notificações**: o número no sino indica as que ainda não leu. Abra a notificação para ir
  directamente ao assunto.

## 5. Como usar estes guias na formação

1. O formador prepara o **ambiente de formação**, com dados fictícios
   ([11-formador.md](11-formador.md)). Nunca se treina com dados reais de doentes.
2. Cada formando lê a secção "O seu dia-a-dia" do seu guia e faz os **exercícios** na ordem
   indicada, com o utilizador de demonstração do seu perfil.
3. Cada exercício diz o **resultado esperado**. Se o resultado for diferente, anote o passo e a
   mensagem que apareceu, e mostre ao formador.
4. Os exercícios de equipa (secção 6) juntam vários perfis no mesmo percurso do doente.

## 6. Exercícios de equipa (vários perfis)

Façam em grupo, cada pessoa no seu computador, com o seu utilizador de demonstração.

**A. Consulta marcada, do registo à receita**

1. Recepção: regista um doente novo e marca-lhe uma consulta para hoje com o Dr. Paulo Neto.
2. Recepção: regista a chegada do doente. → _Abre-se um episódio._
3. Enfermagem: no episódio, carrega em **Iniciar** e regista os sinais vitais.
4. Médico (`medico.demo`): regista anamnese e diagnóstico, pede um hemograma e passa uma receita
   de paracetamol.
5. Laboratório: colhe, analisa e valida o hemograma. → _O médico recebe uma notificação._
6. Farmácia: dispensa a receita. → _O stock do paracetamol diminui._
7. Médico: conclui o episódio.

**B. Urgência**

1. Enfermagem: tria um doente não identificado com prioridade **laranja**.
2. Médico: chama-o da fila e abre o episódio de urgência.
3. Enfermagem: identifica o doente (liga a triagem à ficha do paciente).
4. Médico: decide internar e interna-o numa cama livre.
5. Enfermagem: muda-o de cama.
6. Médico: dá a alta.

**C. Portal do paciente**

1. Recepção: na ficha do doente, gera o código de activação do portal.
2. Doente: activa a conta com o código e a data de nascimento, e entra.
3. Doente: vê o resultado validado no exercício A e a receita.
