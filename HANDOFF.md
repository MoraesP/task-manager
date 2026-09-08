# Handoff — Task Manager

Ponto de continuação do projeto. Última revisão: **2026-09-08**, branch `main`.

Contexto: desafio técnico de contratação. A especificação completa está em
[`docs/`](docs/README.md) (foi "grilada" com a skill `/grill-with-docs`).
Convenção de idioma: **código em português** (comentários, mensagens de erro,
logs); identificadores, campos JSON da API e enums em inglês.

---

## 1. Estado atual

| Parte | Estado |
|---|---|
| **Backend** (`backend/`) | ✅ Completo — Java 17, Spring Boot 3.3, PostgreSQL, Flyway. Todos os endpoints de [docs/06](docs/06-api-endpoints.md) implementados. |
| **Testes backend** | ✅ 51 unitários + 8 de integração (Testcontainers). `./mvnw test` e `./mvnw verify` verdes. |
| **Frontend** (`frontend/`) | ✅ Completo — Angular 20 standalone, signals, CDK. Cobre FE-01…FE-13 (ressalvas em §4). Verificado ponta a ponta no browser. `ng build` limpo. |
| **Testes frontend** | ❌ Nenhum ainda (adiado a pedido). |
| **Mockups** (`design/`) | ✅ Publicados como Claude Design canvas. Fontes em `design/*.dc.html`. |
| **git push** | ❌ Nunca feito. Remote `origin` = `github.com/MoraesP/task-manager` (aparentemente vazio / sem credencial configurada). |

---

## 2. Como rodar

Pré-requisitos no Mac do Pedro (ver memória `dev-environment`):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
colima start
```

**1. PostgreSQL** (Colima não tem o plugin `docker compose`):

```bash
docker run -d --name taskmanager-postgres -p 5432:5432 \
  -e POSTGRES_DB=taskmanager -e POSTGRES_USER=taskmanager -e POSTGRES_PASSWORD=taskmanager \
  postgres:16-alpine
```

**2. Backend** — `cd backend && ./mvnw spring-boot:run` → `http://localhost:8080`
(Swagger em `/swagger-ui.html`). Flyway cria o schema e semeia a conta demo.

**3. Frontend** — `cd frontend && npm install && npm start` → `http://localhost:4200`
(o dev server faz proxy de `/api` para `:8080`).

**Conta demo:** `demo@taskmanager.local` / `password123`

**Testes de integração do backend** exigem `export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"`
antes de `./mvnw verify` (o `pom.xml` já fixa `DOCKER_API_VERSION=1.43` e desliga o Ryuk para o Colima).

---

## 3. Revisão vs. documentação — o que confere

Cruzado com `docs/02` (RF), `docs/04` (RN) e `docs/06` (contrato REST):

- **Endpoints**: todos os 24 de `docs/06` existem, com os papéis/status corretos.
- **Máquina de estados** (RN-01..04): `TaskStatus.canTransitionTo` + 422 em
  transição inválida; `TODO→DONE` e `DONE→TODO` barrados; no-op idempotente.
  O frontend também barra no cliente antes de chamar a API (`ALLOWED_TRANSITIONS`).
- **WIP limit** (RN-10..12): `WipLimitPolicy`, global entre projetos, 409 com
  `tasksInProgress` no corpo.
- **CRITICAL** (RN-20..22): só ADMIN fecha (403); reabrir/mudar prioridade livre.
- **Responsável** (RN-30..32): obrigatório (400), membro do projeto (422), WIP no
  reassign de tarefa em progresso.
- **Papéis** (RN-40..44): checagem em `ProjectAuthorization`; MEMBER não gerencia
  projeto/membros/convites; excluir tarefa = ADMIN ou responsável.
- **Convites** (RN-50..54): token 7 dias, sem e-mail, duplicado PENDING → 409,
  já-membro → 409, aceite cria conta se necessário.
- **Remoção de membro** (RN-60..65): reatribuição obrigatória das tarefas ativas,
  transação única (rollback), tarefas DONE ficam com a pessoa, owner não removível.
- **Datas** (RN-70..71): `createdAt` imutável, `updatedAt` no dirty-check,
  `overdue` derivado.
- **Cache do relatório** (RF-61 / ADR 0006): `@Cacheable` por `projectId`,
  evicção por `TaskChangedEvent` em toda escrita de tarefa.

### Ajustes feitos nos docs nesta revisão

- `docs/06`: `POST /auth/accept-invitation` — a spec previa `{ projectId, role }`;
  a implementação devolve `TokenResponse` (a pessoa já entra autenticada). Doc corrigido.
- `docs/08`: seção "Estrutura" reescrita para refletir a arquitetura real
  (core/shared/features, BEM, templates externos).

### Inconsistência interna das docs (decidir)

- `docs/04` **RN-43** diz **403** para "rebaixar o owner"; `docs/06` e a
  implementação usam **422** (`owner-role-immutable`) no `PATCH /members/{userId}`
  quando o alvo é o owner. O 403 do RN-43 encaixa bem na *remoção*.
  **Recomendação:** aceitar 422 para o rebaixamento e ajustar a redação do RN-43.

---

## 4. Pendências / próximos passos (prioridade sugerida)

### Alta — completar requisitos

1. **Frontend: filtro por range de data de criação** (RF-40). A toolbar do quadro
   só tem range de `deadline`; o backend já aceita `createdFrom`/`createdTo`.
   Adicionar 2 `input[type=date]` em
   `frontend/src/app/features/board/ui/board-toolbar/`.
2. **Swagger: exemplos de `ProblemDetail`** (RF-70). Hoje só há `@Tag`. Adicionar
   um `OpenApiCustomizer` (ou `@ApiResponse` + `@ExampleObject`) mostrando os
   corpos de erro 409 (WIP), 422 (transição/assignee) e 400 (validação) nos
   endpoints de tarefa. Arquivo: `backend/.../shared/config/OpenApiConfig.java`.
3. **Testes de frontend** (a spec de front pede ≥1 teste de componente).
   Mínimo: teste do `TaskCardComponent` (render + evento de mudança de status) e
   1 E2E do fluxo do quadro (Playwright). Karma já vem configurado.

### Média — polimento

4. **`accept-invitation` → ir direto ao projeto.** O frontend navega para
   `/projetos` genérico. Se `POST /auth/accept-invitation` devolver também
   `projectId` + `role` (além dos tokens), o front pode ir para
   `/projetos/:id/quadro`. Mexer em `AuthController.acceptInvitation` +
   `AcceptInvitationPage`.
5. **`remove-member-dialog`**: o `<select>` de reatribuição usa `[value]` (sem
   `ControlValueAccessor` — mesmo bug já corrigido na tabela de membros com
   `[selected]`). Funciona hoje porque começa vazio; endurecer por consistência.
   Arquivo: `frontend/src/app/features/members/ui/remove-member-dialog/`.
6. **Feedback de validação inline nos formulários.** As classes `.input--invalid`
   e `.field__error` existem no `styles.scss` mas nenhum form as usa (hoje: botão
   desabilitado + toast do 400 do backend).
7. **Board paginado por coluna.** Hoje carrega as primeiras 100 tarefas com aviso
   quando há mais. Trocar por paginação/keyset se o volume crescer.

### Baixa — infra e segurança

8. **Audit log da tarefa** (ADIADO na spec). `TaskChangedEvent` já é o ponto de
   escrita natural. Criar tabela `task_change` + `GET /tasks/{id}/history`.
9. **Refresh token em cookie httpOnly** no frontend (hoje access+refresh em
   `localStorage`).
10. **Rate limiting** nos endpoints de `/auth/*`.
11. **Dockerfile do backend e do frontend** + `docker-compose.yml` completo
    (hoje só o Postgres). Não avaliado pela spec, mas facilita a entrega.
12. **`git push`**: configurar credencial do GitHub e publicar a branch `main`
    (repo `MoraesP/task-manager`). O desafio exige repositório acessível.

---

## 5. Notas de arquitetura para continuar

### Backend — `backend/src/main/java/com/taskmanager/`

Monólito modular **package-by-feature** (`auth`, `project`, `task`, `report`,
`shared`), módulo Maven único. Cada feature tem camadas `api` / `domain` / `infra`.
Features conversam **só por serviços públicos**:

- `ProjectAuthorization` — `requireMembership` / `requireAdmin` (403), predicados
  `isMember` / `membershipOf`. Usado por task e report.
- `UserDirectory` (auth) — lookup de usuários para outras features.
- `TaskStatistics` (task) — agregados para o relatório.
- `MemberTasksPort` (interface no `project`, implementada em `task` por
  `TaskReassignmentAdapter`) — quebra o ciclo project↔task na remoção de membro.
- Erros: `Errors.*` → `ApiException` → `GlobalExceptionHandler` → RFC 7807.
  401/403 da cadeia de segurança também passam pelo handler.

ADRs em `docs/adr/`. Migrations em `backend/src/main/resources/db/migration/`.

### Frontend — `frontend/src/app/`

`core/` ⇐ `shared/` ⇐ `features/` (aliases `@core` / `@shared` / `@features`).
Estado em **services com signals**; RxJS só para debounce da busca. Todo
componente tem `.ts`/`.html`/`.scss` separados; **SCSS em BEM**. Detalhes em
`frontend/README.md` e `docs/08-frontend.md`.

- Interceptors (ordem importa): `[errorInterceptor, authInterceptor]` —
  `authInterceptor` (interno) trata 401 com refresh + fila; `errorInterceptor`
  transforma o resto em toast a partir do `ProblemDetail`.
- `BoardService` é `providedIn` no `BoardPage` → recriado ao trocar de projeto.
- Diálogos e drawer via **CDK Dialog + CDK Overlay** (sem Angular Material).

### Convenções

- Git: branch única `main`, Conventional Commits (`feat:`, `fix:`, `refactor:`,
  `docs:`…), commits pequenos e incrementais. O README final precisa das 3 seções
  pedidas (rodar / decisões e tradeoffs / o que faria diferente) — já está.
- Idioma: ver memória `idioma-portugues`. Ao criar código novo, comentários e
  textos ao usuário já em português.
