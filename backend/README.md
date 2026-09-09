# Task Manager — Backend

API REST em Java 17 / Spring Boot 3.3, PostgreSQL + Flyway. Serve o frontend
Angular e é documentada via OpenAPI/Swagger.

## Rodar

```bash
# 1. PostgreSQL (a partir da raiz do repositório)
docker compose up -d
# sem o plugin compose:
# docker run -d --name taskmanager-postgres -p 5432:5432 \
#   -e POSTGRES_DB=taskmanager -e POSTGRES_USER=taskmanager -e POSTGRES_PASSWORD=taskmanager \
#   postgres:16-alpine

# 2. Backend
./mvnw spring-boot:run        # http://localhost:8080
```

Flyway cria o schema e semeia a conta demo (`demo@taskmanager.local` /
`password123`) na primeira execução (`ddl-auto=validate` — o schema é das
migrations, não do Hibernate).

- API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html` · OpenAPI JSON: `/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

## Testes

```bash
./mvnw test      # 55 unitários (services + regras) — não exige Docker
./mvnw verify    # + 8 de integração (@SpringBootTest + Testcontainers) — exige Docker
```

Com Colima, exporte o socket antes do `verify`:

```bash
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
```

O `pom.xml` já fixa `DOCKER_API_VERSION` e desliga o Ryuk para o Colima. O que é
testado e o que não é: [docs/09-estrategia-de-testes.md](../docs/09-estrategia-de-testes.md).

## Arquitetura

Monólito modular **package-by-feature**, um único módulo Maven, um único
deployable. Ver [ADR 0002](../docs/adr/0002-monolito-modular-package-by-feature.md).

```
com.taskmanager/
├── auth/       registro, login, JWT, refresh token, aceite de convite
│   ├── api/    controllers + DTOs (records) + mappers manuais
│   └── domain/ User, RefreshToken, serviços, repositórios (Spring Data)
├── project/    projeto, membership (papel por projeto), convites
│   ├── api/
│   └── domain/ Project, ProjectMembership, Invitation, ProjectAuthorization
├── task/       tarefa, máquina de estados, WIP limit, CRITICAL, histórico
│   ├── api/
│   └── domain/ Task, TaskChange, TaskService, WipLimitPolicy, TaskChangeLog
├── report/     contadores por status/prioridade, com cache
│   ├── api/
│   └── domain/ ReportService, ProjectReportCache
└── shared/     nada de regra de negócio de feature
    ├── config/   SecurityConfig, CorsConfig, OpenApiConfig, CacheConfig, AppProperties
    ├── domain/   BaseEntity (id UUID + createdAt/updatedAt de auditoria)
    ├── error/    Errors → ApiException → GlobalExceptionHandler (RFC 7807)
    ├── event/    TaskChangedEvent (evicção do cache do relatório)
    ├── security/ filtro JWT, CurrentUser, hashing de token opaco
    └── web/      PageResponse (envelope de paginação)
```

**Camadas por feature:** `api` (HTTP: rotas, (de)serialização, validação de DTO,
tradução domínio↔DTO — sem regra de negócio) e `domain` (entidades JPA, serviços
de aplicação, regras, portas de repositório). As "portas" são interfaces Spring
Data — não há implementação manual, então não existe um `infra/` por feature;
integrações técnicas (JWT, hashing, filtro de autenticação) moram em
`shared/security`.

**Fronteira entre features é disciplina de código**, não do compilador. Uma
feature que precisa de dados de outra chama o **serviço público** da outra, nunca
o repositório alheio:

| Serviço | Feature | Para quê |
|---|---|---|
| `ProjectAuthorization` | project | `exigirMembro` / `exigirAdmin` (403), `ehMembro`, `membroDe` |
| `UserDirectory` | auth | lookup somente-leitura de nome/e-mail de usuários |
| `TaskStatistics` | task | agregados para o relatório |
| `MemberTasksPort` | project (interface) / task (impl) | inversão de dependência para realocar tarefas na remoção de membro, sem `project` conhecer `task` |

Detalhes: [docs/07-arquitetura.md](../docs/07-arquitetura.md).

## Convenções

- **Erros** — exceções de negócio tipadas (`Errors.*` → `ApiException`) traduzidas
  para `application/problem+json` (RFC 7807) por um `@RestControllerAdvice` único.
  401/403 da cadeia de segurança também passam por ele.
- **Transações** na fronteira de serviço de `domain` (`@Transactional`). Remoção de
  membro com realocação é **uma transação** — qualquer realocação inválida reverte
  tudo.
- **IDs** UUID gerados na aplicação (`@PrePersist`); **timestamps** em UTC
  (`timestamptz`).
- **DTOs** são `record`s; mapeamento manual (`from(...)`), sem MapStruct.
- **Paginação** sempre via `PageResponse` (padrão 20, máx 100).
- **Idioma:** código em português — variáveis, métodos, comentários, erros, logs.
  Só o contrato da API fica em inglês (campos JSON, enums, paths, DTOs, entidades,
  nomes exigidos pelo Spring). Ver
  [docs/11-convencoes-de-codigo.md](../docs/11-convencoes-de-codigo.md).

## Histórico da tarefa (audit log)

`GET /api/v1/projects/{projectId}/tasks/{taskId}/history` — a criação (quem/quando,
de `Task.createdById` + `createdAt`) e cada alteração de campo feita depois, mais
recente primeiro.

- `TaskChangeLog` (serviço de `domain`) grava uma linha de `TaskChange` **por
  campo alterado**, na **mesma transação** de `editar` / `alterarStatus` /
  realocação. Uma edição que falha na validação não deixa rastro; no-op de status
  (RN-04) não registra.
- Tipos (`TaskChangeType`): `ALTERACAO_TITULO`, `ALTERACAO_DESCRICAO`,
  `ALTERACAO_PRIORIDADE`, `ALTERACAO_PRAZO`, `ALTERACAO_RESPONSAVEL`,
  `ALTERACAO_STATUS` — **único enum do domínio com valores em português** (decisão
  explícita; ver `docs/11`).
- `old_value`/`new_value` guardam o valor "de wire" (nome do enum, ISO da data,
  texto, id do responsável). Na leitura, o `TaskHistoryAssembler` resolve o nome
  do autor e do responsável (batch, sem N+1).
- Migration `V6__task_change.sql`: tabela `task_change` (`ON DELETE CASCADE` de
  `tasks`) + coluna `tasks.created_by_id`.

## Configuração

Variáveis de ambiente (com defaults de desenvolvimento em `application.yml`):

| Variável | Default | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/taskmanager` | JDBC do PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` | `taskmanager` | Credenciais do banco |
| `JWT_SECRET` | (dev) | Segredo HS256 do access token — **trocar em produção** |
| `JWT_ACCESS_TTL` | `PT15M` | Validade do access token (ISO-8601 duration) |
| `JWT_REFRESH_TTL` | `P7D` | Validade do refresh token |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:4200` | Origem do frontend liberada no CORS |
| `SERVER_PORT` | `8080` | Porta HTTP |

Constantes de negócio (não sensíveis, em `application.yml` sob `app.*`): WIP limit
(`app.tasks.wip-limit=5`), TTL do convite (`app.invitations.ttl=P7D`), TTL do cache
do relatório (`app.report.cache-ttl=PT60S`).

## Migrations

`src/main/resources/db/migration/V<n>__<slug>.sql`:

| | |
|---|---|
| `V1` | extensão `pg_trgm` |
| `V2` | `users`, `refresh_tokens` |
| `V3` | `projects`, `project_memberships`, `invitations` |
| `V4` | `tasks` + índices (FKs, filtro/ordenação, GIN de trigramas) |
| `V5` | conta de demonstração |
| `V6` | `task_change` (histórico) + `tasks.created_by_id` |
