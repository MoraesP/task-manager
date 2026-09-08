# 02 — Requisitos funcionais (backend)

Identificadores: `RF-xx`. Regras de negócio detalhadas em
[04-regras-de-negocio.md](04-regras-de-negocio.md). Contrato REST em
[06-api-endpoints.md](06-api-endpoints.md).

## Autenticação e autorização

| ID | Descrição | Status |
|---|---|---|
| RF-01 | Registro de usuário com nome, email e senha. Email único. Senha com hash BCrypt. | OBRIGATÓRIO |
| RF-02 | Login com email e senha, retornando access token (JWT) e refresh token. | OBRIGATÓRIO |
| RF-03 | Renovação do access token via refresh token, com rotação do refresh (o antigo é revogado). | DIFERENCIAL |
| RF-04 | Logout: revoga o refresh token informado. | DIFERENCIAL |
| RF-05 | Todo endpoint de negócio exige access token válido; ausência/inválido → 401. | OBRIGATÓRIO |
| RF-06 | Usuário só vê e manipula projetos aos quais pertence; acesso a projeto alheio → 403. | OBRIGATÓRIO |
| RF-07 | Dois papéis por projeto: `ADMIN` (gerencia o projeto, membros e convites) e `MEMBER` (gerencia apenas tarefas). | OBRIGATÓRIO |
| RF-08 | Endpoint `GET /users/me` com os dados do usuário autenticado. | OBRIGATÓRIO |

## Projetos

| ID | Descrição | Status |
|---|---|---|
| RF-10 | Criar projeto (nome, descrição). O criador vira `owner` e `ADMIN` do projeto. | OBRIGATÓRIO |
| RF-11 | Listar projetos do usuário autenticado (paginado). | OBRIGATÓRIO |
| RF-12 | Detalhar um projeto (somente membros). | OBRIGATÓRIO |
| RF-13 | Editar nome/descrição do projeto (somente `ADMIN`). | OBRIGATÓRIO |
| RF-14 | Excluir projeto (somente `owner`). Hard delete com cascade em tarefas, memberships, convites e histórico. | OBRIGATÓRIO |
| RF-15 | Listar membros do projeto com seus papéis. | OBRIGATÓRIO |

## Membros e convites

| ID | Descrição | Status |
|---|---|---|
| RF-20 | `ADMIN` cria convite para um email com um papel (`ADMIN`/`MEMBER`); gera token com validade de 7 dias. Sem envio de email — o token volta na resposta. | OBRIGATÓRIO |
| RF-21 | Aceitar convite: se o email não tem conta, cria a conta (nome + senha) e a associação; se já tem, cria só a associação. Convite passa a `ACCEPTED`. | OBRIGATÓRIO |
| RF-22 | `ADMIN` lista e revoga convites pendentes do projeto. | OBRIGATÓRIO |
| RF-23 | `ADMIN` altera o papel de um membro (não pode rebaixar o `owner`). | OBRIGATÓRIO |
| RF-24 | `ADMIN` remove um membro. Se o membro tem tarefas ativas (`TODO`/`IN_PROGRESS`), a remoção exige realocar todas para outros membros, respeitando o WIP limit; caso contrário a operação falha inteira (rollback). Membro sem tarefas ativas permanece no projeto até ser removido explicitamente. | OBRIGATÓRIO |

## Tarefas

| ID | Descrição | Status |
|---|---|---|
| RF-30 | Criar tarefa dentro de um projeto: título, descrição, status, prioridade, prazo (opcional) e responsável (obrigatório, deve ser membro do projeto). Status inicial `TODO`. | OBRIGATÓRIO |
| RF-31 | Editar campos da tarefa (título, descrição, prioridade, prazo, responsável). | OBRIGATÓRIO |
| RF-32 | Alterar status da tarefa respeitando a máquina de estados e as regras de negócio (RN). | OBRIGATÓRIO |
| RF-33 | Excluir tarefa (somente `ADMIN` do projeto ou o responsável atual). | OBRIGATÓRIO |
| RF-34 | Detalhar uma tarefa. | OBRIGATÓRIO |
| RF-35 | A tarefa mantém data de criação, data de última atualização e prazo. | OBRIGATÓRIO |

## Listagem, filtros e ordenação

| ID | Descrição | Status |
|---|---|---|
| RF-40 | Listar tarefas de um projeto com filtros combináveis: status, prioridade, responsável, range de data de criação e range de deadline. | OBRIGATÓRIO |
| RF-41 | Ordenação por prioridade, data de criação ou deadline (asc/desc). | OBRIGATÓRIO |
| RF-42 | Toda listagem é paginada e devolve metadata: `page`, `size`, `totalElements`, `totalPages`. | DIFERENCIAL |

## Busca textual

| ID | Descrição | Status |
|---|---|---|
| RF-50 | Endpoint de busca de tarefas por texto no título ou na descrição, dentro de um projeto. Case-insensitive, casa trechos parciais. Índice `pg_trgm` GIN. Resultado paginado. | OBRIGATÓRIO |

## Relatório

| ID | Descrição | Status |
|---|---|---|
| RF-60 | Endpoint que retorna, para um projeto, contadores de tarefas por status e por prioridade: `{ "byStatus": { "TODO": 12, ... }, "byPriority": { "LOW": 3, ... } }`. Todos os valores dos enums aparecem, mesmo que zero. | OBRIGATÓRIO |
| RF-61 | Resposta do relatório é cacheada por projeto (ver [ADR 0006](adr/0006-cache-caffeine-relatorio.md)). | DIFERENCIAL |

## Documentação da API

| ID | Descrição | Status |
|---|---|---|
| RF-70 | Todos os endpoints documentados via OpenAPI, com Swagger UI acessível e exemplos de payload de erro (`ProblemDetail`). | OBRIGATÓRIO |

## Notificação (frontend)

| ID | Descrição | Status |
|---|---|---|
| RF-80 | Ao atribuir uma tarefa ao usuário logado, o frontend exibe um toast. | DIFERENCIAL |
