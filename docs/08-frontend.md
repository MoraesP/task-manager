# 08 — Frontend (Angular 20)

Diferencial. Entra na v1 depois do backend estar completo. Objetivo: demonstrar
componentização clara e UX minimamente funcional — não visual elaborado.

## Stack

| Item | Escolha |
|---|---|
| Framework | Angular 20, standalone components, sem NgModules |
| Estado | Services com signals nativos (`signal`, `computed`); RxJS apenas para operadores de fluxo (debounce da busca, cancelamento). Ver [ADR 0007](adr/0007-estado-frontend-signals.md) |
| HTTP | `HttpClient` + interceptor para `Authorization` e refresh automático em 401 |
| Roteamento | Angular Router com guard de autenticação |
| Drag-and-drop | Angular CDK (`@angular/cdk/drag-drop`) |
| UI | Angular Material (rápido, acessível) — ou CSS simples; sem exigência de tema |
| Notificação | `MatSnackBar` (toast) |
| Testes | Jasmine/Karma ou Vitest; ≥ 1 teste de componente |
| Build | Angular CLI (`ng build`) |

## Requisitos funcionais do frontend

| ID | Descrição | Status |
|---|---|---|
| FE-01 | Tela de login e de registro. Guarda tokens; renova o access token via refresh automaticamente. | OBRIGATÓRIO (se frontend) |
| FE-02 | Aceite de convite via link com token (`/accept-invitation?token=...`). | OBRIGATÓRIO |
| FE-03 | Lista de projetos do usuário; criar projeto. | OBRIGATÓRIO |
| FE-04 | Board do projeto: colunas `TODO` / `IN_PROGRESS` / `DONE` com os cards de tarefa. | OBRIGATÓRIO |
| FE-05 | Drag-and-drop de card entre colunas dispara `PATCH .../status`; erro de regra (WIP, transição inválida, CRITICAL) reverte o card e mostra o `detail` do `ProblemDetail`. | OBRIGATÓRIO |
| FE-06 | Criar/editar tarefa (título, descrição, prioridade, prazo, responsável dentre os membros). | OBRIGATÓRIO |
| FE-07 | Filtros do board: status, prioridade, responsável, range de datas; ordenação. | OBRIGATÓRIO |
| FE-08 | Campo de busca textual (debounce ~300 ms) usando `/tasks/search`. | OBRIGATÓRIO |
| FE-09 | Painel de relatório: contadores por status e por prioridade. | OBRIGATÓRIO |
| FE-10 | Tela de membros (para ADMIN): listar, convidar (mostra o token gerado), alterar papel, remover com realocação de tarefas. | OBRIGATÓRIO |
| FE-11 | Toast quando uma tarefa é atribuída ao usuário logado. | DIFERENCIAL |
| FE-12 | Responsividade básica (board utilizável em telas estreitas). | OBRIGATÓRIO |
| FE-13 | Paginação nas listas que consomem endpoints paginados. | OBRIGATÓRIO |

## Estrutura sugerida

```
frontend/src/app/
├── core/          interceptors, guards, auth service (signals), api base
├── shared/        componentes reutilizáveis (card, badge de prioridade, paginador)
├── auth/          login, register, accept-invitation
├── projects/      lista e criação de projetos
├── board/         board, coluna, card, filtros, busca
├── members/       gestão de membros e convites
└── report/        painel de relatório
```

## Padrões

- Um **feature service** por área expõe signals de leitura (`readonly`) e métodos
  de comando; componentes não chamam `HttpClient` direto.
- Estado derivado (tarefas por coluna, contadores) via `computed`.
- Erros de API são normalizados a partir do `ProblemDetail` em um único ponto
  (interceptor) e exibidos via snackbar.
- Sem store global; o estado do board vive no `BoardService`, recriado ao trocar
  de projeto.
