# 10 — Checklist de desenvolvimento

Mapeia o estado de implementação de **cada requisito** da especificação contra o
código na branch `main`. Cruzado com [02](02-requisitos-funcionais.md),
[03](03-requisitos-nao-funcionais.md), [04](04-regras-de-negocio.md),
[06](06-api-endpoints.md), [08](08-frontend.md) e [09](09-estrategia-de-testes.md).

Última verificação: **2026-09-08** · complementa o [HANDOFF.md](../HANDOFF.md).

## Legenda

| Símbolo | Significado |
|---|---|
| ✅ | Feito e verificado |
| ⚠️ | Parcial — falta um pedaço (detalhado na coluna Observação) |
| ❌ | Não implementado |
| ⏸️ | ADIADO na spec (fora da v1, registrado no README final) |

---

## 1. Requisitos funcionais do backend (`RF-xx`)

### Autenticação e autorização

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-01 Registro + email único + BCrypt | ✅ | `auth/api/AuthController#registrar`, `auth/domain/UserService`, `V2__auth.sql` (unique) | |
| RF-02 Login → access + refresh | ✅ | `AuthController#autenticar`, `AuthService` | |
| RF-03 Refresh com rotação | ✅ | `auth/domain/RefreshTokenService`, `RefreshTokenServiceTest` | DIFERENCIAL entregue |
| RF-04 Logout revoga refresh | ✅ | `AuthController#sair` | DIFERENCIAL entregue |
| RF-05 Endpoint de negócio exige token → 401 | ✅ | `shared/security/JwtAuthenticationFilter`, `SecurityConfig` | |
| RF-06 Só vê projeto que pertence → 403 | ✅ | `project/domain/ProjectAuthorization#exigirMembro` | |
| RF-07 Papéis ADMIN / MEMBER por projeto | ✅ | `project/domain/Role`, `ProjectMembership` | |
| RF-08 `GET /users/me` | ✅ | `auth/api/UserController` | |

### Projetos

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-10 Criar projeto (criador vira owner/ADMIN) | ✅ | `project/domain/ProjectService#criar` | |
| RF-11 Listar projetos do usuário (paginado) | ✅ | `ProjectController#listar`, `shared/web/PageResponse` | |
| RF-12 Detalhar projeto (só membro) | ✅ | `ProjectController#obter` + `ProjectAuthorization` | |
| RF-13 Editar nome/descrição (só ADMIN) | ✅ | `ProjectService#atualizar` | |
| RF-14 Excluir projeto (só owner) + cascade | ✅ | `ProjectService#excluir`; `ON DELETE CASCADE` em `V3`/`V4` | |
| RF-15 Listar membros com papéis | ✅ | `project/api/MembershipController#listar` | |

### Membros e convites

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-20 Convite por email + papel, token 7d, sem envio | ✅ | `project/domain/InvitationService#criar`, `app.invitations.ttl=P7D` | token volta no corpo |
| RF-21 Aceitar convite (cria conta se preciso) | ✅ | `InvitationService#aceitar`, `AuthController#acceptInvitation` | |
| RF-22 Listar e revogar convites pendentes (ADMIN) | ✅ | `project/api/InvitationController` | |
| RF-23 Alterar papel de membro (não rebaixa owner) | ✅ | `project/domain/MembershipService#alterarPapel` | ver inconsistência RN-43 abaixo |
| RF-24 Remover membro com realocação + rollback | ✅ | `MembershipService#removerMembro`, `task/domain/TaskReassignmentAdapter`, `MemberTasksPort` | transação única |

### Tarefas

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-30 Criar tarefa (status inicial TODO, responsável obrigatório) | ✅ | `task/domain/TaskService#criar` | |
| RF-31 Editar campos da tarefa | ✅ | `TaskService#atualizar` | |
| RF-32 Alterar status respeitando a máquina de estados | ✅ | `task/domain/TaskStatus#podeTransicionarPara`, `TaskService#alterarStatus` | |
| RF-33 Excluir tarefa (ADMIN ou responsável) | ✅ | `TaskService#excluir` | |
| RF-34 Detalhar tarefa | ✅ | `task/api/TaskController#obter` | |
| RF-35 createdAt / updatedAt / deadline | ✅ | `shared/domain/BaseEntity`, `Task` | |
| RF-36 Histórico da tarefa (criação + alterações campo a campo) | ✅ | `task/domain/TaskChange`, `TaskChangeLog`, `task/api/TaskHistoryAssembler`, `TaskController#historico`, migration `V6`, `TaskChangeLogTest` | DIFERENCIAL entregue |

### Listagem, filtros, ordenação, busca

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-40 Filtros combináveis (status, prioridade, responsável, range criação, range deadline) | ⚠️ | Backend: `task/domain/TaskSpecifications` + `TaskFilter` cobre `createdFrom/To` e `deadlineFrom/To`. Frontend: `board-toolbar` **só tem range de deadline** | Falta 2 `input[type=date]` de criação na toolbar (HANDOFF §4.1) |
| RF-41 Ordenação por prioridade/criação/deadline (asc/desc) | ✅ | `task/domain/TaskSort` | |
| RF-42 Paginação com metadata | ✅ | `shared/web/PageResponse` (`page/size/totalElements/totalPages`) | DIFERENCIAL entregue |
| RF-50 Busca textual pg_trgm GIN, case-insensitive, parcial, paginada | ✅ | `V1__extensions.sql` (pg_trgm), `V4` índices GIN, `TaskRepository`, `TaskSearchIT` | |

### Relatório e documentação

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-60 Relatório por status e prioridade, todos os enums (zero incluso) | ✅ | `report/domain/ReportService`, `ProjectReport` | |
| RF-61 Relatório cacheado por projeto | ✅ | `report/domain/ProjectReportCache`, `shared/config/CacheConfig`, evicção via `shared/event/TaskChangedEvent` | DIFERENCIAL entregue |
| RF-70 OpenAPI + Swagger UI + **exemplos de payload de erro** | ⚠️ | `shared/config/OpenApiConfig` (info + bearerAuth), Swagger em `/swagger-ui.html` | **Faltam exemplos de `ProblemDetail`** (409 WIP, 422 transição/assignee, 400 validação) — HANDOFF §4.2 |

### Notificação (frontend)

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RF-80 Toast ao atribuir tarefa ao usuário logado | ✅ | `features/board/pages/board-page/board.page.ts:143-153` | DIFERENCIAL entregue |

---

## 2. Requisitos não funcionais (`RNF-xx`)

| ID | Status | Evidência / Observação |
|---|---|---|
| RNF-01 Java 17 + Spring Boot 3.x | ✅ | `backend/pom.xml` (Java 17, Spring Boot 3.3) |
| RNF-02 Maven, módulo único | ✅ | `backend/pom.xml` |
| RNF-03 REST/JSON, base `/api/v1` | ✅ | controllers com `/api/v1/...` |
| RNF-04 PostgreSQL + Flyway + `ddl-auto=validate` | ✅ | `application.yml:10`, `db/migration/V1..V5` |
| RNF-05 Config sensível via env, não commitada | ✅ | `application.yml` usa `${DB_URL}`, `${JWT_SECRET}`, `${CORS_ALLOWED_ORIGIN}` |
| RNF-06 `docker-compose.yml` sobe o Postgres | ✅ | `docker-compose.yml` (postgres 16 + healthcheck + volume) |
| RNF-10 JWT HS256, access 15 min | ✅ | `shared/security/JwtService`, `app.security.jwt.access-token-ttl=PT15M` |
| RNF-11 Refresh opaco, 7d, hash, rotação, reuso invalida cadeia | ✅ | `auth/domain/RefreshTokenService`, `shared/security/OpaqueTokens`, `RefreshTokenServiceTest` |
| RNF-12 BCrypt cost 10–12 | ✅ | `SecurityConfig` (`BCryptPasswordEncoder`) |
| RNF-13 Autorização na camada de serviço | ✅ | `ProjectAuthorization` chamado pelos services de `task`/`report`/`project` |
| RNF-14 CORS só para a origem do frontend | ✅ | `SecurityConfig` + `app.security.cors.allowed-origin` |
| RNF-15 Sem token/segredo em URL | ✅ | tokens só em corpo (login/refresh/logout/accept) |
| RNF-20 Bean Validation nos DTOs de request | ✅ | `@Valid` + constraints em `*Dtos` |
| RNF-21 `@RestControllerAdvice` + `application/problem+json` | ✅ | `shared/error/GlobalExceptionHandler` |
| RNF-22 Mapa de status 400/401/403/404/409/422 | ✅ | `shared/error/Errors`, `ApiException`, `GlobalExceptionHandler` |
| RNF-23 Mensagens de negócio claras e acionáveis | ✅ | ex.: WIP retorna limite + `tasksInProgress` |
| RNF-30 Busca < 100 ms com GIN pg_trgm | ✅ (design) | índices `idx_tasks_*_trgm` em `V4`; sem benchmark formal |
| RNF-31 Listagens paginadas (padrão 20, máx 100) | ✅ | `shared/web` / config de paginação |
| RNF-32 Relatório em 1 query `GROUP BY` + cache TTL 60 s | ✅ | `report/infra` query agregada, `report.cache-ttl=PT60S` |
| RNF-33 Índices em FKs e colunas de filtro/ordenação | ✅ | `V4__tasks.sql` (project/status/priority/created/deadline/assignee) |
| RNF-34 Contagem WIP por query agregada | ✅ | `task/domain/WipLimitPolicy` (count query) |
| RNF-40 SLF4J; 5xx com stack, 4xx de negócio em WARN sem stack | ✅ | `GlobalExceptionHandler` (níveis de log) |
| RNF-41 Actuator `/actuator/health` | ✅ | `spring-boot-starter-actuator`, `management.endpoints...include: health, info` |
| RNF-50 Separação de camadas por feature | ✅ | `api`/`domain`/`infra` em `auth`/`project`/`task`/`report` |
| RNF-51 Sem over-engineering | ✅ | mapper manual, sem MapStruct, sem store global no front |
| RNF-52 Nomeação segue o glossário | ✅ | termos de [glossario.md](glossario.md); idioma/nomenclatura em [11-convencoes-de-codigo.md](11-convencoes-de-codigo.md) — código em português (variáveis, métodos), contrato da API em inglês |
| RNF-53 Timestamps em UTC (`timestamptz`) | ✅ | `hibernate.jdbc.time_zone: UTC`, colunas `TIMESTAMPTZ` |
| RNF-60 Unitários de service cobrindo as RN | ✅ | 55 testes (ver §5) |
| RNF-61 Integração `@SpringBootTest` + Testcontainers | ✅ | `AuthFlowIT`, `TaskLifecycleIT`, `TaskSearchIT` |
| RNF-62 Sem meta de cobertura; README explica prioridades | ✅ | `README.md` seção de decisões |
| RNF-70 Repo Git, branch `main`, Conventional Commits | ⚠️ | commits semânticos OK; **`git push` nunca feito** (HANDOFF §4.12) — o desafio exige repo acessível |
| RNF-71 README (rodar / decisões / o que faria diferente) | ✅ | `README.md` com as 3 seções |

---

## 3. Regras de negócio (`RN-xx`)

| ID | Status | Evidência | Observação |
|---|---|---|---|
| RN-01 Transições válidas | ✅ | `task/domain/TaskStatus#podeTransicionarPara`, `TaskStatusTest` | 422 em transição inválida |
| RN-02 `DONE→TODO` proibido | ✅ | `TaskStatus`, `TaskServiceTest` | |
| RN-03 `TODO→DONE` proibido | ✅ | `TaskStatus`, `TaskServiceTest` | |
| RN-04 Mesmo estado = no-op idempotente (200) | ✅ | `TaskService#alterarStatus`, `TaskServiceTest` | |
| RN-10 WIP limit 5, somando projetos | ✅ | `task/domain/WipLimitPolicy`, `WipLimitPolicyTest`, `TaskLifecycleIT#wipLimitBlocksSixthInProgressTask` | 409 |
| RN-11 Checagem em status→IN_PROGRESS e reassign de IN_PROGRESS | ✅ | `WipLimitPolicy` chamado em `changeStatus` e `update` | |
| RN-12 Erro informa limite + `tasksInProgress` | ✅ | `Errors` + corpo do `ProblemDetail` | |
| RN-20 Fechar CRITICAL (`IN_PROGRESS→DONE`) só ADMIN | ✅ | `TaskService#alterarStatus` + `ProjectAuthorization#exigirAdmin`, `TaskServiceTest` | 403 |
| RN-21 Demais transições de CRITICAL livres (inclui reabrir) | ✅ | `TaskService`, `TaskServiceTest` | |
| RN-22 Mudar prioridade de/para CRITICAL livre | ✅ | `TaskService#atualizar` | |
| RN-30 Responsável obrigatório na criação | ✅ | `TaskDtos` (`@NotNull assigneeId`), `TaskServiceTest` | 400 |
| RN-31 Responsável precisa ser membro ativo | ✅ | `TaskService` valida via `ProjectAuthorization#ehMembro`, `TaskServiceTest` | 422 |
| RN-32 Reassign de IN_PROGRESS aplica WIP ao novo dono | ✅ | `TaskService#atualizar` + `WipLimitPolicy` | 409 |
| RN-40 Só membro acessa projeto/tarefa/relatório/busca | ✅ | `ProjectAuthorization#exigirMembro` | 403 |
| RN-41 MEMBER só gerencia tarefas | ✅ | `ProjectAuthorization`, `ProjectServiceTest` | 403 |
| RN-42 ADMIN edita projeto/convites/papéis/remoção/fecha CRITICAL | ✅ | `exigirAdmin` nos pontos correspondentes | |
| RN-43 owner sempre ADMIN, não rebaixável nem removível | ⚠️ | `MembershipService` bloqueia; `owner-role-immutable` | **Inconsistência doc:** RN-43 diz 403 para rebaixar; implementação e [06](06-api-endpoints.md) usam **422**. Decidir redação (HANDOFF §3) |
| RN-44 Excluir tarefa: ADMIN ou responsável | ✅ | `TaskService#excluir` | 403 |
| RN-50 Convite expirado não aceita (`EXPIRED`) | ✅ | `InvitationService#aceitar`, `InvitationServiceTest` | 422 |
| RN-51 Sem convite `PENDING` duplicado | ✅ | `InvitationService#criar`, `InvitationServiceTest` | 409 |
| RN-52 Não convidar quem já é membro | ✅ | `InvitationService#criar`, `InvitationServiceTest` | 409 |
| RN-53 Aceite cria conta vs. só associação | ✅ | `InvitationService#aceitar`, `InvitationServiceTest` | |
| RN-54 Só ADMIN cria/lista/revoga convites | ✅ | `InvitationController` + `exigirAdmin` | 403 |
| RN-60 Remoção iniciada por ADMIN; membro sem tarefa fica | ✅ | `MembershipService#removerMembro`, `MembershipServiceTest` | |
| RN-61 Tarefas ativas exigem novo responsável para cada | ✅ | `MembershipService#removerMembro`, `MembershipServiceTest` | 422 |
| RN-62 Novo responsável membro + sem estourar WIP | ✅ | `MembershipService` + `WipLimitPolicy` | 409 |
| RN-63 Realocação inválida = nada aplicado (transação única) | ✅ | `@Transactional` em `MembershipService#removerMembro`, `MembershipServiceTest` | |
| RN-64 Tarefas DONE do removido permanecem com ele | ✅ | `MembershipService`, `MembershipServiceTest` | |
| RN-65 owner nunca removível | ✅ | `MembershipService#removerMembro` | 403 |
| RN-70 `createdAt` imutável, `updatedAt` a cada alteração | ✅ | `shared/domain/BaseEntity` (`@CreatedDate`/`@LastModifiedDate`) | |
| RN-71 `deadline` opcional, pode estar no passado; `overdue` derivado | ✅ | `Task`, `task/api/TaskResponseAssembler` (`overdue` calculado) | |

---

## 4. Contrato REST — [06-api-endpoints.md](06-api-endpoints.md) (24 endpoints)

| Grupo | Endpoints | Status |
|---|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/accept-invitation` | ✅ (5/5) |
| Usuário | `GET /users/me` | ✅ (1/1) |
| Projetos | `POST /projects`, `GET /projects`, `GET /projects/{id}`, `PUT /projects/{id}`, `DELETE /projects/{id}` | ✅ (5/5) |
| Membros/convites | `GET`/`PATCH`/`DELETE /projects/{id}/members[/{userId}]`, `POST`/`GET`/`DELETE /projects/{id}/invitations[/{invId}]` | ✅ (6/6) |
| Tarefas | `POST`/`GET` `/tasks`, `GET /tasks/search`, `GET`/`PUT`/`DELETE /tasks/{id}`, `PATCH /tasks/{id}/status` | ✅ (7/7) |
| Relatório | `GET /projects/{id}/report` | ✅ (1/1) |

Observações:
- `POST /auth/accept-invitation` devolve `TokenResponse` (pessoa já entra
  autenticada). Doc [06](06-api-endpoints.md) já corrigido. Melhoria pendente:
  devolver também `projectId` + `role` para o front navegar direto ao quadro
  (HANDOFF §4.4).
- Erros em `application/problem+json` (RFC 7807) via `GlobalExceptionHandler`. ✅

---

## 5. Testes

### 5.1 Backend — unitários (`RNF-60`) · 55 testes ✅

| Alvo (spec [09](09-estrategia-de-testes.md) §1) | Arquivo | Status |
|---|---|---|
| Máquina de estados | `task/domain/TaskServiceTest`, `TaskStatusTest` | ✅ |
| WIP limit (6ª, cruza projetos, reassign) | `task/domain/WipLimitPolicyTest`, `TaskServiceTest` | ✅ |
| Regra CRITICAL (MEMBER 403, ADMIN ok, reabrir ok) | `task/domain/TaskServiceTest` | ✅ |
| Responsável (sem responsável, não-membro) | `task/domain/TaskServiceTest` | ✅ |
| Papéis (`ProjectService`) | `project/domain/ProjectServiceTest`, `ProjectAuthorizationTest` | ✅ |
| Convites (duplicado, membro existente, expirado, aceite) | `project/domain/InvitationServiceTest` (7) | ✅ |
| Remoção de membro (todos os casos RN-60..64) | `project/domain/MembershipServiceTest` (4) | ✅ |
| Auth (refresh rotaciona/revoga, senha errada) | `auth/domain/AuthServiceTest`, `RefreshTokenServiceTest`, `UserServiceTest` | ✅ |
| Relatório (enums com zero + cache) | `report/domain/ProjectReportCacheTest` | ✅ |
| Reatribuição (adapter) | `task/domain/TaskReassignmentAdapterTest` | ✅ |
| Histórico (linha por campo, no-op não registra, status, reassign p/ o mesmo) | `task/domain/TaskChangeLogTest` (4) | ✅ |

### 5.2 Backend — integração (`RNF-61`) · 8 testes ✅

| Fluxo (spec §2) | Arquivo | Status |
|---|---|---|
| Autenticação (register→login→protegido→refresh→logout→revogado falha) | `auth/AuthFlowIT` (3) | ✅ |
| Ciclo de vida da tarefa (`TODO→IN_PROGRESS→DONE` + relatório + histórico) | `task/TaskLifecycleIT` | ✅ |
| Autorização (MEMBER edita projeto → 403; fora do projeto → 403) | `task/TaskLifecycleIT#memberCannotUpdateProject`, `#nonMemberCannotSeeProject` | ✅ |
| Busca (trecho parcial em título e descrição) | `task/TaskSearchIT` | ✅ |
| Contrato de erro (WIP → `problem+json` 409 + `detail`) | `task/TaskLifecycleIT#wipLimitBlocksSixthInProgressTask` | ✅ |

### 5.3 Frontend (`RNF` spec [08](08-frontend.md), ≥1 teste de componente) · ❌

| Item | Status | Observação |
|---|---|---|
| Karma/Jasmine configurado | ✅ | `frontend/package.json` (`ng test`), `tsconfig.spec.json` |
| Teste de componente (card ou coluna do board) | ❌ | **0 arquivos `*.spec.ts`** — pendência da spec (HANDOFF §4.3) |

### 5.4 E2E (opcional, spec §4) · ❌

| Item | Status | Observação |
|---|---|---|
| 1 cenário Playwright (login → board → drag → reload) | ❌ | sem pasta `e2e/`; opcional "se sobrar tempo" |

---

## 6. Frontend Angular — [08-frontend.md](08-frontend.md) (`FE-xx`)

| ID | Status | Evidência | Observação |
|---|---|---|---|
| FE-01 Login e registro; guarda tokens; refresh automático | ✅ | `features/auth/pages/*`, `core/auth/auth.service`, `core/interceptors/auth.interceptor` | tokens em `localStorage` (endurecer → cookie httpOnly, HANDOFF §4.9) |
| FE-02 Aceite de convite via link com token | ✅ | `features/auth/pages/accept-invitation` | navega para `/projetos` genérico; poderia ir ao quadro (HANDOFF §4.4) |
| FE-03 Lista de projetos + criar | ✅ | `features/projects/pages/projects-list`, `ui/create-project-dialog` | |
| FE-04 Board com colunas TODO/IN_PROGRESS/DONE | ✅ | `features/board/pages/board-page`, `ui/task-card` | |
| FE-05 Drag-and-drop → `PATCH /status`; erro reverte + mostra `detail` | ✅ | `board.page.ts` (revert + toast do `ProblemDetail`) | também barra no cliente via `ALLOWED_TRANSITIONS` |
| FE-06 Criar/editar tarefa (todos os campos) | ✅ | `features/board/ui/task-drawer` | |
| FE-06b Aba "Histórico" no drawer | ✅ | `features/board/ui/task-history`, `TasksApiService#historico` | criação + alterações agrupadas por salvamento (campo · antigo → novo) |
| FE-07 Filtros (status, prioridade, responsável, range de datas) + ordenação | ⚠️ | `features/board/ui/board-toolbar` | **só range de deadline** — falta range de data de criação (RF-40 / HANDOFF §4.1) |
| FE-08 Busca textual com debounce ~300 ms | ✅ | `board-toolbar.component.ts` (`debounceTime(300)`) | |
| FE-09 Painel de relatório (contadores) | ✅ | `features/report/pages/report-page` | |
| FE-10 Tela de membros (ADMIN): listar/convidar/papel/remover c/ realocação | ✅ | `features/members/pages/members-page`, `ui/invite-dialog`, `ui/remove-member-dialog` | `remove-member-dialog` usa `[value]` no `<select>` — endurecer p/ `[selected]` (HANDOFF §4.5) |
| FE-11 Toast quando tarefa é atribuída ao usuário logado | ✅ | `board.page.ts:143-153` | DIFERENCIAL entregue |
| FE-12 Responsividade básica do board | ✅ | `core/layout/layout.service`, SCSS BEM responsivo | verificado no browser |
| FE-13 Paginação nas listas paginadas | ✅ | `shared/components/paginator` | |

Extras não exigidos, mas presentes: feedback de validação inline nos formulários
(classes `.input--invalid`/`.field__error` existem mas **nenhum form usa** — HANDOFF §4.6).

---

## 7. Entrega e infraestrutura

| Item | Status | Observação |
|---|---|---|
| README com 3 seções (rodar / decisões / o que faria diferente) | ✅ | `README.md` |
| `docker-compose.yml` (Postgres) | ✅ | RNF-06 satisfeito |
| Dockerfile do backend/frontend + compose completo | ⏸️ | fora de escopo da spec; facilita entrega (HANDOFF §4.11) |
| Commits Conventional + incrementais | ✅ | histórico da `main` |
| **`git push` para repo acessível** | ❌ | **bloqueante do desafio** — `origin = github.com/MoraesP/task-manager`, nunca publicado (HANDOFF §4.12) |
| Mockups das telas (`design/`) | ✅ | publicados como Claude Design canvas |

---

## 8. Pendências consolidadas (ordem sugerida)

### Bloqueante da entrega
1. **`git push`** da branch `main` para `MoraesP/task-manager` (RNF-70).

### Alta — fecha requisito obrigatório
2. **RF-40 / FE-07** — range de data de criação na `board-toolbar` (2 `input[type=date]`; backend já aceita `createdFrom`/`createdTo`).
3. **RF-70** — exemplos de `ProblemDetail` no Swagger (409 WIP, 422 transição/assignee, 400 validação) via `OpenApiConfig`/`@ApiResponse`.
4. **Testes de frontend** — ≥1 teste de componente (`TaskCardComponent`); opcional 1 E2E do board.

### Média — polimento
5. Inconsistência **RN-43** (403 vs 422 no rebaixamento do owner) — ajustar redação da doc para 422.
6. `accept-invitation` devolver `projectId` + `role`; front navegar para `/projetos/:id/quadro`.
7. `remove-member-dialog`: trocar `[value]` por `[selected]` no `<select>`.
8. Feedback de validação inline nos formulários (classes já existem no `styles.scss`).
9. Board paginado por coluna (hoje carrega as primeiras 100).

### Baixa — infra e segurança (ADIADO / fora de escopo)
10. ✅ ~~Audit log da tarefa~~ — **implementado**: `task_change` (V6) +
    `TaskChangeLog` + `GET /tasks/{id}/history` + aba "Histórico" no drawer.
    `TaskChangeLogTest` (4) + `TaskLifecycleIT` cobrem.
11. Refresh token em cookie httpOnly no frontend.
12. Rate limiting em `/auth/*`.
13. Dockerfile de backend e frontend + `docker-compose` completo da aplicação.
