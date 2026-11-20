# Guia do Formador: preparar o ambiente de formação

A formação faz-se **sempre com dados fictícios**, numa base de dados própria, nunca na base de
produção nem com dados reais de doentes.

## 1. Criar o ambiente de formação

No computador da formação, com o backend e o frontend instalados (ver o README de cada projecto):

1. Crie no MySQL uma base vazia só para a formação, por exemplo `ngolahealth_formacao`.
2. No `backend/.env`:
   ```
   DB_NAME=ngolahealth_formacao
   DEMO_DATA=true
   DEV_ADMIN_PASSWORD=<senha de formação, com 12 ou mais caracteres>
   ```
3. Arranque o backend (`./mvnw spring-boot:run`) e o frontend (`npm start`). No primeiro arranque
   o sistema cria o **Hospital Demo Ngola** com 30 dias de actividade fictícia: doentes,
   consultas, triagens, exames, receitas, internamentos, escalas e equipamentos (cerca de um
   minuto).
4. Abra `http://localhost:4200`.

Para recomeçar do zero (por exemplo, antes de cada turma): apague a base `ngolahealth_formacao`,
crie-a vazia outra vez e volte a arrancar o backend.

## 2. Utilizadores de formação

Todos com a senha definida em `DEV_ADMIN_PASSWORD`:

| Utilizador        | Nome                    | Perfil                                                   | Guia                                 |
| ----------------- | ----------------------- | -------------------------------------------------------- | ------------------------------------ |
| `recepcao.demo`   | Celeste Recepção        | Recepcionista                                            | [01](01-recepcao.md)                 |
| `enfermeira.demo` | Enf. Rosa Cassoma       | Enfermeiro                                               | [02](02-enfermagem.md)               |
| `enfermeiro.demo` | Enf. Mateus Lumbo       | Enfermeiro                                               | [02](02-enfermagem.md)               |
| `medico.demo`     | Dr. Paulo Neto          | Médico (Medicina Interna)                                | [03](03-medicos.md)                  |
| `medica.demo`     | Dra. Helena Kiala       | Médico (Pediatria)                                       | [03](03-medicos.md)                  |
| `lab.demo`        | Téc. Lurdes Laboratório | Técnico de laboratório                                   | [04](04-laboratorio.md)              |
| `farmacia.demo`   | Dr. Bento Farmácia      | Farmacêutico                                             | [05](05-farmacia.md)                 |
| `gestor.demo`     | Graça Gestora           | Gestor                                                   | [06](06-gestao.md)                   |
| `admin.demo`      | Administrador Demo      | Administrador                                            | [07](07-administrador-hospital.md)   |
| `platform-admin`  | —                       | Administrador da plataforma (muda a senha no 1.º acesso) | [08](08-administrador-plataforma.md) |
| `doente.demo`     | —                       | Doente (portal)                                          | [09](09-portal-doente.md)            |

Numa turma grande, use a conta `admin.demo` para criar uma conta por formando (por exemplo,
`form01.enf`, `form02.enf`), para que cada um trabalhe com o seu nome e se veja na auditoria.

## 3. Plano de sessão sugerido

| Bloco | Duração   | Conteúdo                                                                                               |
| ----- | --------- | ------------------------------------------------------------------------------------------------------ |
| 1     | 30 min    | [README](README.md): o que é o sistema, o percurso do doente, quem faz o quê, regras de senha e sessão |
| 2     | 60–90 min | Guia do perfil de cada formando: ler "O seu dia-a-dia" e fazer os exercícios                           |
| 3     | 30 min    | [Guia para todos](10-todos-rh-equipamentos.md): ponto, férias, avarias                                 |
| 4     | 45 min    | Exercícios de equipa A, B e C do [README](README.md#6-exercícios-de-equipa-vários-perfis)              |
| 5     | 15 min    | Dúvidas; mostrar a auditoria com as acções da turma (`admin.demo`)                                     |

## 4. Validar a formação

Cada formando completa os exercícios do seu guia. O formador confirma na **Auditoria**
(`admin.demo`) que as acções foram feitas pelo utilizador do formando. Registe os passos que
geraram dúvidas, para melhorar estes guias.
