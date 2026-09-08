# 03 — Requisitos não funcionais e técnicos

Identificadores: `RNF-xx`.

## Plataforma e build

| ID | Requisito |
|---|---|
| RNF-01 | Java 17. Spring Boot 3.x (última minor estável compatível com Java 17). |
| RNF-02 | Build com Maven, projeto de módulo único. |
| RNF-03 | API REST sobre JSON. Base path `/api/v1`. |
| RNF-04 | Banco PostgreSQL. Schema versionado com Flyway; `spring.jpa.hibernate.ddl-auto=validate`. |
| RNF-05 | Configuração sensível (credenciais do banco, segredo JWT, origem CORS) via variáveis de ambiente, nunca commitada. |
| RNF-06 | `docker-compose.yml` sobe o PostgreSQL para desenvolvimento local. |

## Segurança

| ID | Requisito |
|---|---|
| RNF-10 | Spring Security. Access token JWT assinado com HS256; expiração de 15 minutos. |
| RNF-11 | Refresh token opaco, expiração de 7 dias, persistido apenas como hash. Rotação a cada uso; reuso de token revogado invalida a cadeia. |
| RNF-12 | Senhas com BCrypt (cost 10–12). |
| RNF-13 | Autorização verificada na camada de serviço (pertencimento ao projeto + papel). `@PreAuthorize` onde simplificar. |
| RNF-14 | CORS liberado apenas para a origem do frontend. |
| RNF-15 | Sem dados sensíveis em URL (tokens e segredos só em corpo ou header). |

## Validação e erros

| ID | Requisito |
|---|---|
| RNF-20 | Validação de entrada com Bean Validation (`jakarta.validation`) nos DTOs de request. |
| RNF-21 | Tratamento global de erros com `@RestControllerAdvice`, resposta padronizada `application/problem+json` (RFC 7807 / `ProblemDetail`). |
| RNF-22 | Mapa de status: 400 (validação), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 409 (conflito de negócio: WIP limit, remoção de membro, email/convite duplicado), 422 (transição de status inválida, responsável não é membro). |
| RNF-23 | Mensagens de erro de negócio são claras e acionáveis (ex.: WIP limit informa o limite e as tarefas que já contam). |

## Desempenho

| ID | Requisito |
|---|---|
| RNF-30 | Busca textual (RF-50) apoiada em índice `pg_trgm` GIN; alvo < 100 ms para ~100k tarefas por projeto. |
| RNF-31 | Listagens sempre paginadas (tamanho padrão 20, máximo 100). |
| RNF-32 | Relatório (RF-60) resolvido em uma única query com `GROUP BY`; resultado cacheado (Caffeine, chave = `projectId`, TTL 60 s, evicção em qualquer escrita de tarefa do projeto). |
| RNF-33 | Índices em todas as FKs e nas colunas usadas em filtro/ordenação de tarefas (`status`, `priority`, `assignee_id`, `created_at`, `deadline`). |
| RNF-34 | Contagem de tarefas `IN_PROGRESS` por responsável (WIP limit) resolvida por query agregada, não carregando coleções. |

## Observabilidade

| ID | Requisito |
|---|---|
| RNF-40 | Logging com SLF4J. Erros 5xx logados com stack trace; 4xx de negócio em nível `WARN` sem stack. |
| RNF-41 | `spring-boot-actuator` com `/actuator/health` exposto. |

## Qualidade de código

| ID | Requisito |
|---|---|
| RNF-50 | Separação clara de camadas e responsabilidades por feature (ver [07-arquitetura.md](07-arquitetura.md)). |
| RNF-51 | Sem over-engineering: nenhuma abstração sem segundo caso de uso concreto. |
| RNF-52 | Nomeação segue o [glossário](glossario.md). |
| RNF-53 | Timestamps persistidos em UTC (`timestamptz`). |

## Testes

| ID | Requisito |
|---|---|
| RNF-60 | Testes unitários dos services cobrindo todas as regras de negócio (JUnit 5 + Mockito). |
| RNF-61 | Testes de integração com `@SpringBootTest` + Testcontainers (PostgreSQL real) para autenticação e fluxo de tarefa. |
| RNF-62 | Sem meta de cobertura; o README explica o que foi priorizado. |

## Entrega

| ID | Requisito |
|---|---|
| RNF-70 | Repositório Git com acesso liberado. Branch única `main`. Commits semânticos (Conventional Commits) e incrementais. |
| RNF-71 | README com: instruções para rodar, decisões técnicas e trade-offs, e o que faria diferente com mais tempo. |
