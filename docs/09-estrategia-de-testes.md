# 09 — Estratégia de testes

Critério de avaliação de peso "Médio": o que foi priorizado e por quê. Sem meta
de cobertura.

## Prioridade

1. **Unitários de serviço (domain)** — onde vivem as regras. Maior retorno.
2. **Integração (`@SpringBootTest` + Testcontainers)** — poucos, cobrindo os
   fluxos de ponta a ponta que mais quebram: autenticação e ciclo de vida da tarefa.
3. **Frontend** — 1 teste de componente (exigência da spec).
4. **E2E** — no máximo 1 fluxo do board, só se sobrar tempo.

## 1. Unitários — services (JUnit 5 + Mockito)

Repositórios e serviços de outras features são mockados.

| Alvo | Casos mínimos |
|---|---|
| Máquina de estados (`TaskService`) | cada transição válida (RN-01); `DONE→TODO` bloqueado (RN-02); `TODO→DONE` bloqueado (RN-03); no-op idempotente (RN-04) |
| WIP limit | 6ª tarefa `IN_PROGRESS` do mesmo responsável → erro (RN-10); contagem cruza projetos (RN-10); reatribuição de tarefa `IN_PROGRESS` respeita o limite do novo dono (RN-32) |
| Regra CRITICAL | `MEMBER` fechando `CRITICAL` → 403 (RN-20); `ADMIN` fechando `CRITICAL` → ok; `MEMBER` reabrindo `CRITICAL` `DONE→IN_PROGRESS` → ok (RN-21) |
| Responsável | criar tarefa sem responsável → erro (RN-30); responsável não-membro → erro (RN-31) |
| Papéis (`ProjectService`) | `MEMBER` editando projeto → 403 (RN-41); `ADMIN` ok (RN-42); rebaixar/remover owner → erro (RN-43) |
| Convites | convite duplicado `PENDING` (RN-51); convidar membro existente (RN-52); aceitar convite expirado (RN-50); aceite cria conta vs. só associação (RN-53) |
| Remoção de membro | membro sem tarefas ativas → remove direto (RN-60); com tarefas ativas sem `reassignments` completos → erro (RN-61); reassignment para não-membro (RN-62); reassignment que estoura WIP → nada aplicado (RN-63); tarefas `DONE` não exigem realocação (RN-64) |
| Auth | refresh válido rotaciona e revoga o anterior (RNF-11); refresh revogado → 401; senha errada → 401 |
| Relatório | todos os enums presentes com zero quando não há tarefas (RF-60) |

## 2. Integração (`@SpringBootTest`, `MockMvc` ou `WebTestClient`, Testcontainers PostgreSQL)

| Fluxo | Passos |
|---|---|
| Autenticação | register → login → acessar endpoint protegido → refresh → logout → refresh revogado falha |
| Ciclo de vida da tarefa | login ADMIN → criar projeto → convidar + aceitar MEMBER → criar tarefa → `TODO→IN_PROGRESS→DONE` → relatório reflete os contadores |
| Autorização | MEMBER tenta editar projeto → 403; usuário fora do projeto acessa tarefa → 403 |
| Busca | criar tarefas → `search?q=` casa trecho parcial no título e na descrição |
| Contrato de erro | disparar WIP limit → resposta `application/problem+json` com `status` 409 e `detail` |

## 3. Frontend (Jest + jest-preset-angular)

Sem meta de cobertura — só as regras essenciais (`npm test` na pasta `frontend/`).

| Alvo | Casos |
|---|---|
| Máquina de estados no cliente (`canTransition`) | transições válidas (RN-01); `TODO→DONE` e `DONE→TODO` barrados (RN-02/03); mesmo estado é no-op (RN-04) |
| `TaskCardComponent` | renderiza título/id/responsável; o menu "mover para" só oferece as transições válidas; escolher um destino emite `mover` e fecha o menu; clique no card emite `abrir`; "Excluir" emite `excluir` |
| Normalização de erro (`mensagemDeErro`) | prioriza `detail` do ProblemDetail; junta `errors[]` na validação; cai para `title`; reconhece falha de rede; fallback |
| `BoardService` | agrupa tarefas por coluna; `moverOtimista` move o card entre colunas sem chamar a API e reverte; `criar`/`atualizar`/`excluir` refletem no estado |

## 4. E2E (opcional)

- Playwright, 1 cenário: login → abrir board → arrastar card `TODO→IN_PROGRESS` →
  card persiste após reload.

## O que não será testado (e por quê)

- Getters/setters, mappers triviais, configuração do Spring.
- Caminhos de framework (serialização JSON, roteamento).
- Cobertura exaustiva de combinações de filtro — um teste representativo basta.
