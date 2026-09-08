# 01 — Visão geral

## Contexto

Sistema simplificado de gerenciamento de tarefas (task manager) para equipes de
desenvolvimento. Usuários criam, editam, acompanham e organizam tarefas dentro de
projetos. Autenticação por email/senha com JWT; autorização por projeto.

## Escopo da v1

**Entra:**

- Backend REST completo (todos os requisitos obrigatórios).
- Diferenciais: paginação com metadata, cache no relatório, frontend Angular
  (board com drag-and-drop e toast de atribuição), refresh token.
- Documentação da API via OpenAPI/Swagger.

**Não entra (ADIADO — registrar no README final):**

- Audit log com histórico campo a campo da tarefa (`task_change`).
- Testes E2E além de, no máximo, um fluxo do board.
- Envio real de email nos convites (o token é retornado na resposta da API).

**Fora de escopo (não avaliado):**

- Deploy, Dockerfile da aplicação (há apenas `docker-compose` para o Postgres).
- Visual elaborado; cobertura de testes de 100%.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 17 |
| Framework backend | Spring Boot 3.x (última minor estável compatível com Java 17) |
| Build | Maven (módulo único) |
| Persistência | PostgreSQL + Flyway |
| Segurança | Spring Security + JWT (HS256), access + refresh token |
| Doc da API | springdoc-openapi (Swagger UI) |
| Testes backend | JUnit 5, Mockito, `@SpringBootTest`, Testcontainers |
| Frontend | Angular 20 (standalone components, signals + RxJS) |
| Infra local | `docker-compose` com PostgreSQL (Colima) |

## Resumo das decisões-chave

Detalhes e trade-offs em [adr/](adr/).

1. **PostgreSQL** como banco real, com Flyway e Testcontainers — [ADR 0001](adr/0001-postgresql-flyway-testcontainers.md).
2. **Monólito modular package-by-feature**, módulo Maven único — [ADR 0002](adr/0002-monolito-modular-package-by-feature.md).
3. **Papel por projeto** (`ProjectMembership`), sem papel global — [ADR 0003](adr/0003-papel-por-projeto.md).
4. **JWT com refresh token rotativo** persistido (hash) — [ADR 0004](adr/0004-jwt-com-refresh-token.md).
5. **Busca textual com `pg_trgm` + índice GIN**, query `ILIKE` — [ADR 0005](adr/0005-busca-textual-pg-trgm.md).
6. **Cache Caffeine só no relatório**, invalidação por evento de escrita — [ADR 0006](adr/0006-cache-caffeine-relatorio.md).
7. **Estado no frontend com signals + services**, sem NgRx — [ADR 0007](adr/0007-estado-frontend-signals.md).

## Estrutura do repositório

```
/
├── backend/            projeto Maven único (package-by-feature)
├── frontend/           workspace Angular 20
├── docs/               esta documentação
├── docker-compose.yml  PostgreSQL para desenvolvimento
└── README.md           instruções de execução, decisões e trade-offs
```
