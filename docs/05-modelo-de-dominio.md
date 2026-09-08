# 05 — Modelo de domínio

Contexto único (task management). Vocabulário canônico em
[glossario.md](glossario.md).

## Diagrama de entidades

```
User 1───* RefreshToken
User 1───* ProjectMembership *───1 Project
User 1───* Invitation (createdBy)      Project 1───* Invitation
User 1───* Task (assignee)             Project 1───* Task
Project *───1 User (owner)
Task 1───* TaskChange   (ADIADO — não implementado na v1)
```

## Entidades

### User

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| name | string | obrigatório |
| email | string | único, obrigatório |
| passwordHash | string | BCrypt |
| createdAt | timestamptz | |

Sem papel global. O que o usuário pode fazer depende do `ProjectMembership`.

### Project

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| name | string | obrigatório |
| description | string | opcional |
| ownerId | UUID | FK → User; sempre também tem `ProjectMembership` ADMIN |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

### ProjectMembership

Associação usuário↔projeto com papel. Ver [ADR 0003](adr/0003-papel-por-projeto.md).

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| projectId | UUID | FK → Project |
| userId | UUID | FK → User |
| role | enum | `ADMIN` \| `MEMBER` |
| createdAt | timestamptz | |

Único por (`projectId`, `userId`).

### Invitation

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| projectId | UUID | FK → Project |
| email | string | destinatário |
| role | enum | papel a conceder (`ADMIN` \| `MEMBER`) |
| tokenHash | string | hash do token entregue na resposta da API |
| status | enum | `PENDING` \| `ACCEPTED` \| `EXPIRED` \| `REVOKED` |
| createdById | UUID | FK → User |
| expiresAt | timestamptz | criação + 7 dias |
| createdAt | timestamptz | |

Um único convite `PENDING` por (`projectId`, `email`).

### Task

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| projectId | UUID | FK → Project |
| title | string | obrigatório |
| description | text | opcional |
| status | enum | `TODO` \| `IN_PROGRESS` \| `DONE`; inicia em `TODO` |
| priority | enum | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| assigneeId | UUID | FK → User; **obrigatório**; deve ser membro do projeto |
| deadline | timestamptz | opcional |
| createdAt | timestamptz | imutável |
| updatedAt | timestamptz | |

Índices: `projectId`, `assigneeId`, `status`, `priority`, `createdAt`, `deadline`;
GIN `pg_trgm` em `title` e `description`.

### RefreshToken

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| tokenHash | string | nunca guardamos o valor |
| expiresAt | timestamptz | criação + 7 dias |
| revokedAt | timestamptz | null enquanto válido |
| createdAt | timestamptz | |

### TaskChange — ADIADO (não implementado na v1)

Histórico campo a campo (`taskId`, `field`, `oldValue`, `newValue`, `changedById`,
`changedAt`). Registrado aqui para o README final; fora do escopo da v1.

## Enums

| Enum | Valores | Ordem para ordenação |
|---|---|---|
| `Role` | ADMIN, MEMBER | — |
| `TaskStatus` | TODO, IN_PROGRESS, DONE | TODO < IN_PROGRESS < DONE |
| `TaskPriority` | LOW, MEDIUM, HIGH, CRITICAL | LOW < MEDIUM < HIGH < CRITICAL |
| `InvitationStatus` | PENDING, ACCEPTED, EXPIRED, REVOKED | — |

`priority` e `status` são persistidos como `varchar` (`@Enumerated(STRING)`);
a ordenação "por prioridade" usa a ordem semântica acima, não a alfabética.

## Regras de integridade

- Excluir `Project` → cascade em `ProjectMembership`, `Invitation`, `Task`
  (hard delete — [ADR 0002](adr/0002-monolito-modular-package-by-feature.md) e decisão Q20).
- Excluir `User` não é exposto na API na v1.
- `Task.assigneeId` não é anulável; a "remoção de membro" (RN-60..65) garante que
  toda tarefa ativa seja realocada antes de a membership sumir.
