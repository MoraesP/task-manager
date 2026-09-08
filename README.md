# Task Manager

Sistema de gerenciamento de tarefas para equipes de desenvolvimento.
Backend REST em Java 17 / Spring Boot 3 e frontend em Angular 20.

A especificação completa (requisitos, regras de negócio, contrato da API,
arquitetura e ADRs) está em [`docs/`](docs/README.md). Mockups das telas em
[`design/`](design/) (Claude Design).

## Pré-requisitos

- Java 17
- Node 20.19+ ou 22.12+ (para o frontend)
- Maven 3.9+ (ou use o wrapper `./mvnw` em `backend/`)
- Docker (Colima, Docker Desktop, etc.) para o PostgreSQL e os testes de integração

## Como rodar

```bash
# 1. Subir o PostgreSQL
docker compose up -d
# sem o plugin compose:
# docker run -d --name taskmanager-postgres -p 5432:5432 \
#   -e POSTGRES_DB=taskmanager -e POSTGRES_USER=taskmanager -e POSTGRES_PASSWORD=taskmanager \
#   postgres:16-alpine

# 2. Rodar o backend
cd backend
./mvnw spring-boot:run

# 3. Rodar o frontend (em outro terminal)
cd frontend
npm install
npm start
```

Flyway cria o schema e semeia a conta de demonstração na primeira execução.

- API: `http://localhost:8080/api/v1` · Swagger UI: `http://localhost:8080/swagger-ui.html`
- Frontend: `http://localhost:4200` (o dev server faz proxy de `/api` para `:8080`)

### Conta de demonstração

Já existe um usuário semeado pela migration para testar rápido:

| Email | Senha |
|---|---|
| `demo@taskmanager.local` | `password123` |

```bash
curl -s http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@taskmanager.local","password":"password123"}'
```

## Testes

```bash
cd backend
./mvnw test      # unitários (services) — não exige Docker
./mvnw verify    # + testes de integração (Testcontainers) — exige Docker rodando
```

Com Colima, exporte o socket antes do `verify`:

```bash
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
```

(a versão da API do Docker e o Ryuk já vêm ajustados no `pom.xml` para o Colima.)

## Configuração

Variáveis de ambiente (com defaults de desenvolvimento):

| Variável | Default | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/taskmanager` | JDBC do PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` | `taskmanager` | Credenciais do banco |
| `JWT_SECRET` | (dev) | Segredo HS256 do access token — **trocar em produção** |
| `JWT_ACCESS_TTL` | `PT15M` | Validade do access token (ISO-8601 duration) |
| `JWT_REFRESH_TTL` | `P7D` | Validade do refresh token |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:4200` | Origem do frontend |

## Decisões técnicas e trade-offs

Ver [`docs/adr/`](docs/adr/). Resumo:

- PostgreSQL + Flyway + Testcontainers (ADR 0001)
- Monólito modular package-by-feature, módulo Maven único (ADR 0002)
- Papel por projeto via `ProjectMembership` (ADR 0003)
- JWT access curto + refresh token rotativo (ADR 0004)
- Busca textual com `pg_trgm` + índice GIN (ADR 0005)
- Cache Caffeine só no relatório, invalidação por evicção (ADR 0006)

## Estrutura do backend

Monólito modular *package-by-feature* (`auth`, `project`, `task`, `report`,
`shared`), módulo Maven único. Cada feature tem camadas internas `api` / `domain`
/ `infra` e conversa com as outras apenas pelos serviços públicos
(`ProjectAuthorization`, `UserDirectory`, `TaskStatistics`, `MemberTasksPort`).
Detalhes em [docs/07-arquitetura.md](docs/07-arquitetura.md).

## Estrutura do frontend

Angular 20 standalone (sem NgModules), em três camadas com aliases de path
(`@core`, `@shared`, `@features`):

- **`core/`** — infraestrutura, subdividida em `auth/`, `http/`, `interceptors/`,
  `layout/`, `notifications/`. `core` nunca importa de `features`.
- **`shared/`** — `models/` (interfaces da API + enums, um arquivo por domínio) e
  `components/` (widgets reutilizáveis: icon, avatar, badges, paginator, topbar…).
- **`features/`** — uma pasta por feature (`auth`, `projects`, `project`, `board`,
  `members`, `report`, `shell`); dentro de cada: `<feature>.routes.ts`, `data/`
  (services + estado em signals), `models/`, `pages/` (`*.page.ts`), `ui/`
  (componentes locais).

Todo componente tem `.ts` / `.html` / `.scss` separados. SCSS em **BEM**; o
`styles.scss` global carrega só os tokens e primitivos do design system.
Drag-and-drop com Angular CDK; diálogos com CDK Dialog. Detalhes em
[frontend/README.md](frontend/README.md), [docs/08-frontend.md](docs/08-frontend.md)
e [ADR 0007](docs/adr/0007-estado-frontend-signals.md).

Regras de negócio no cliente: transição de status inválida é barrada antes de
chamar a API (e revertida com o `detail` do ProblemDetail se o servidor recusar);
o menu de status de cada card só oferece transições válidas; a remoção de membro
exige reatribuir as tarefas ativas.

Testes de frontend ainda não foram escritos (fora do escopo desta iteração).

## O que eu faria diferente com mais tempo

- **Audit log da tarefa** (histórico campo a campo, `who/what/when`) — o
  `TaskChangedEvent` já existe e seria o ponto de escrita natural.
- **Refresh token no frontend em cookie httpOnly** em vez de corpo JSON.
- **Envio real de e-mail** nos convites (hoje o token volta na resposta da API).
- **Paginação keyset** na busca para datasets muito grandes, no lugar de offset.
- **Cobrir mais fluxos com testes E2E** e testes de contrato da API (ex.: schemas
  OpenAPI versionados).
- **Rate limiting** nos endpoints de autenticação.
- **Testes de frontend** (componente do card / coluna, 1 fluxo E2E do quadro).
- **Board paginado por coluna** (hoje carrega as primeiras 100 tarefas e mostra
  aviso quando há mais — o suficiente para o desafio).
- **Contagem global de WIP no cliente** exige um endpoint dedicado; hoje o front
  confia na validação do backend (erro 409 com o detalhe).
