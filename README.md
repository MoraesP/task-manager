# Task Manager

Sistema de gerenciamento de tarefas para equipes de desenvolvimento.
Backend REST em Java 17 / Spring Boot 3 e frontend em Angular 20 (em construção).

A especificação completa (requisitos, regras de negócio, contrato da API,
arquitetura e ADRs) está em [`docs/`](docs/README.md).

## Pré-requisitos

- Java 17
- Maven 3.9+ (ou use o wrapper `./mvnw` em `backend/`)
- Docker (Colima, Docker Desktop, etc.) para o PostgreSQL e os testes de integração

## Como rodar

```bash
# 1. Subir o PostgreSQL
docker compose up -d

# 2. Rodar o backend
cd backend
./mvnw spring-boot:run
```

API em `http://localhost:8080/api/v1`. Swagger UI em
`http://localhost:8080/swagger-ui.html`.

## Testes

```bash
cd backend
./mvnw test      # unitários (services) — não exige Docker
./mvnw verify    # + testes de integração (Testcontainers) — exige Docker rodando
```

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

## O que eu faria diferente com mais tempo

_(a preencher ao longo do desenvolvimento)_

- Histórico de alterações da tarefa (audit log campo a campo).
- Refresh token em cookie httpOnly no frontend.
- Testes E2E de mais fluxos.
- Envio real de email nos convites.
