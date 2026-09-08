# 06 — Contrato da API REST

Base path: `/api/v1`. Corpo e respostas em JSON. Erros em
`application/problem+json` (RFC 7807). Autenticação via header
`Authorization: Bearer <accessToken>`, exceto nos endpoints marcados _(público)_.

## Convenções

- IDs são UUID.
- Datas em ISO-8601 UTC.
- Listagens aceitam `page` (0-based, padrão 0), `size` (padrão 20, máx 100) e
  `sort` (`campo,asc|desc`).
- Envelope de página:

```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```

## Autenticação

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| POST | `/auth/register` _(público)_ | Cria usuário. Body: `{ name, email, password }` | 201 `{ id, name, email }` |
| POST | `/auth/login` _(público)_ | Body: `{ email, password }` | 200 `{ accessToken, refreshToken, tokenType, expiresIn }` |
| POST | `/auth/refresh` _(público)_ | Body: `{ refreshToken }`. Rotaciona o refresh. | 200 `{ accessToken, refreshToken, tokenType, expiresIn }` |
| POST | `/auth/logout` | Body: `{ refreshToken }`. Revoga o refresh. | 204 |
| POST | `/auth/accept-invitation` _(público)_ | Body: `{ token, name?, password? }`. `name`/`password` obrigatórios se o email ainda não tem conta. | 200 `{ accessToken, refreshToken, tokenType, expiresIn }` — a pessoa já entra autenticada |

Erros: 400 (validação), 401 (credenciais inválidas / refresh inválido ou
revogado), 409 (email já registrado), 422 (convite expirado/revogado).

## Usuário

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/users/me` | Dados do usuário autenticado. | 200 `{ id, name, email }` |

## Projetos

| Método | Rota | Papel | Sucesso |
|---|---|---|---|
| POST | `/projects` | qualquer autenticado (vira owner/ADMIN) | 201 `ProjectResponse` |
| GET | `/projects` | membro | 200 página de `ProjectResponse` |
| GET | `/projects/{projectId}` | membro | 200 `ProjectResponse` |
| PUT | `/projects/{projectId}` | ADMIN | 200 `ProjectResponse` |
| DELETE | `/projects/{projectId}` | owner | 204 |

`ProjectResponse`: `{ id, name, description, ownerId, role, memberCount, createdAt, updatedAt }`
(`role` = papel do solicitante no projeto).

## Membros e convites

| Método | Rota | Papel | Sucesso |
|---|---|---|---|
| GET | `/projects/{projectId}/members` | membro | 200 `[{ userId, name, email, role }]` |
| PATCH | `/projects/{projectId}/members/{userId}` | ADMIN | 200 — Body: `{ role }` |
| DELETE | `/projects/{projectId}/members/{userId}` | ADMIN | 204 — Body opcional: `{ reassignments: [{ taskId, newAssigneeId }] }` |
| POST | `/projects/{projectId}/invitations` | ADMIN | 201 `{ id, email, role, token, expiresAt }` |
| GET | `/projects/{projectId}/invitations` | ADMIN | 200 `[{ id, email, role, status, expiresAt }]` |
| DELETE | `/projects/{projectId}/invitations/{invitationId}` | ADMIN | 204 (status → `REVOKED`) |

Erros: 403 (papel insuficiente / não-membro), 409 (email já é membro, convite
`PENDING` duplicado, remoção de membro que estoura WIP), 422 (rebaixar owner,
reassignment para não-membro, faltou reatribuir alguma tarefa ativa).

## Tarefas

| Método | Rota | Papel | Sucesso |
|---|---|---|---|
| POST | `/projects/{projectId}/tasks` | membro | 201 `TaskResponse` |
| GET | `/projects/{projectId}/tasks` | membro | 200 página de `TaskResponse` |
| GET | `/projects/{projectId}/tasks/search` | membro | 200 página de `TaskResponse` |
| GET | `/projects/{projectId}/tasks/{taskId}` | membro | 200 `TaskResponse` |
| PUT | `/projects/{projectId}/tasks/{taskId}` | membro | 200 `TaskResponse` |
| PATCH | `/projects/{projectId}/tasks/{taskId}/status` | membro (ADMIN se fechar CRITICAL) | 200 `TaskResponse` |
| DELETE | `/projects/{projectId}/tasks/{taskId}` | ADMIN ou responsável | 204 |

### Criação / edição — body

```json
{
  "title": "string",
  "description": "string | null",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "deadline": "2026-09-30T18:00:00Z | null",
  "assigneeId": "uuid"
}
```

### Mudança de status — body

```json
{ "status": "TODO | IN_PROGRESS | DONE" }
```

### Filtros de `GET /tasks`

| Param | Efeito |
|---|---|
| `status` | um valor de `TaskStatus` |
| `priority` | um valor de `TaskPriority` |
| `assigneeId` | UUID do responsável |
| `createdFrom`, `createdTo` | range de `createdAt` |
| `deadlineFrom`, `deadlineTo` | range de `deadline` |
| `sort` | `priority,desc` \| `createdAt,asc` \| `deadline,asc` (padrão `createdAt,desc`) |

### Busca `GET /tasks/search`

| Param | Efeito |
|---|---|
| `q` | texto (obrigatório, mín. 2 caracteres); casa trecho parcial em `title` ou `description`, case-insensitive |
| `page`, `size` | paginação |

`TaskResponse`: `{ id, projectId, title, description, status, priority, assigneeId, assigneeName, deadline, overdue, createdAt, updatedAt }`.

Erros: 403 (não-membro; fechar CRITICAL sem ser ADMIN), 404 (tarefa/projeto),
409 (WIP limit), 422 (transição inválida, responsável não é membro).

## Relatório

| Método | Rota | Papel | Sucesso |
|---|---|---|---|
| GET | `/projects/{projectId}/report` | membro | 200 |

```json
{
  "byStatus":   { "TODO": 12, "IN_PROGRESS": 3, "DONE": 45 },
  "byPriority": { "LOW": 20, "MEDIUM": 25, "HIGH": 10, "CRITICAL": 5 }
}
```

Todos os valores de enum sempre presentes (zero quando não há tarefas).
Resposta cacheada por `projectId` (ver [ADR 0006](adr/0006-cache-caffeine-relatorio.md)).

## Formato de erro (RFC 7807)

```json
{
  "type": "https://taskmanager/errors/wip-limit-exceeded",
  "title": "WIP limit exceeded",
  "status": 409,
  "detail": "O responsável já tem 5 tarefas IN_PROGRESS (limite: 5).",
  "instance": "/api/v1/projects/{id}/tasks/{id}/status",
  "tasksInProgress": ["uuid", "uuid", "uuid", "uuid", "uuid"]
}
```

## Documentação viva

- OpenAPI JSON: `/v3/api-docs`
- Swagger UI: `/swagger-ui.html`
