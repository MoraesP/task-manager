# 07 — Arquitetura

Ver [ADR 0002](adr/0002-monolito-modular-package-by-feature.md) para o racional.

## Estilo

Monólito modular, **package-by-feature**, um único módulo Maven, um único
deployable. Cada feature é um pacote de topo com camadas internas; a fronteira
entre features é disciplina de código (não imposta pelo build).

## Estrutura de pacotes

```
com.taskmanager
├── auth/
│   ├── api/          controllers, DTOs de request/response, mappers
│   ├── domain/       User, RefreshToken, serviços (register, login, refresh, invitation accept)
│   └── infra/        repositórios JPA, geração/validação de JWT, BCrypt
├── project/
│   ├── api/
│   ├── domain/       Project, ProjectMembership, Invitation, regras de papel e convite
│   └── infra/
├── task/
│   ├── api/
│   ├── domain/       Task, máquina de estados, WIP limit, regra CRITICAL, reatribuição
│   └── infra/        repositório (queries de filtro, busca pg_trgm)
├── report/
│   ├── api/
│   ├── domain/       serviço de agregação
│   └── infra/        query GROUP BY, configuração de cache
└── shared/
    ├── config/       SecurityConfig, CorsConfig, OpenApiConfig, CacheConfig, JpaConfig
    ├── error/        ProblemDetail handler (@RestControllerAdvice), exceções de negócio
    ├── security/     filtro JWT, CurrentUser, @PreAuthorize helpers
    └── web/          envelope de página, tipos comuns
```

## Camadas internas de cada feature

| Camada | Responsabilidade | Depende de |
|---|---|---|
| `api` | HTTP: rotas, (de)serialização, validação de DTO, tradução domínio↔DTO. Sem regra de negócio. | `domain` |
| `domain` | Entidades JPA, serviços de aplicação, regras de negócio, portas de repositório (interfaces Spring Data). | `shared` |
| `infra` | Implementações de acesso a dados e integrações técnicas (JWT, hashing). | `domain` |

Regras:

- `api` nunca fala com repositório direto — sempre via serviço de `domain`.
- Uma feature que precisa de dados de outra chama o **serviço** público da outra
  feature (ex.: `task` valida membership via serviço de `project`), nunca o
  repositório alheio.
- `shared` não depende de nenhuma feature.

## Decisões transversais

| Tema | Decisão |
|---|---|
| Persistência | Spring Data JPA + Hibernate; PostgreSQL; Flyway (`ddl-auto=validate`). |
| Transações | `@Transactional` na fronteira de serviço de `domain`. Remoção de membro com reatribuição é uma transação única. |
| Autenticação | Filtro `OncePerRequestFilter` valida o JWT e popula o `SecurityContext` com o `userId`. |
| Autorização | Verificada nos serviços de `domain` (pertencimento + papel); `@PreAuthorize` só para checagens simples de papel. |
| Erros | Exceções de negócio tipadas em `shared/error`, traduzidas para `ProblemDetail` por um `@RestControllerAdvice` único. |
| Cache | Spring Cache + Caffeine, configurado em `shared/config`, usado só por `report`. |
| Mapeamento DTO | Manual (métodos de mapper por feature). Sem MapStruct na v1 (evita processador de anotação para pouca economia). |
| IDs | UUID gerado na aplicação (`UUID.randomUUID()`), coluna `uuid`. |
| Migrations | `backend/src/main/resources/db/migration/V<n>__<slug>.sql`. |

## Configuração e perfis

| Perfil | Uso |
|---|---|
| `default` / `local` | PostgreSQL do `docker-compose`; segredo JWT de desenvolvimento. |
| `test` | Testcontainers PostgreSQL; migrations Flyway aplicadas. |

Variáveis de ambiente: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
`JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `CORS_ALLOWED_ORIGIN`.
