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
| Testes | Jest + `jest-preset-angular`; regras essenciais (ver [09](09-estrategia-de-testes.md) §3) |
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
| FE-06b | Aba "Histórico" no drawer de edição: criação (quem/quando) + cada alteração agrupada por salvamento, com campo, valor antigo → novo. Consome `GET /tasks/{id}/history`. | DIFERENCIAL |
| FE-07 | Filtros do board: status, prioridade, responsável, range de datas; ordenação. | OBRIGATÓRIO |
| FE-08 | Campo de busca textual (debounce ~300 ms) usando `/tasks/search`. | OBRIGATÓRIO |
| FE-09 | Painel de relatório: contadores por status e por prioridade. | OBRIGATÓRIO |
| FE-10 | Tela de membros (para ADMIN): listar, convidar (mostra o token gerado), alterar papel, remover com realocação de tarefas. | OBRIGATÓRIO |
| FE-11 | Toast quando uma tarefa é atribuída ao usuário logado. | DIFERENCIAL |
| FE-12 | Responsividade básica (board utilizável em telas estreitas). | OBRIGATÓRIO |
| FE-13 | Paginação nas listas que consomem endpoints paginados. | OBRIGATÓRIO |

## Estrutura (implementada)

Três camadas, com aliases de path `@core` / `@shared` / `@features`. Regra de
dependência: `core` ⇐ `shared` ⇐ `features` (nunca o inverso).

```
frontend/src/app/
├── core/                     infraestrutura, sem UI de domínio
│   ├── auth/                 AuthService (signals) + guards
│   ├── http/                 api.config (base + HttpContextTokens), problem-detail
│   ├── interceptors/         auth (Authorization + refresh em 401) · error (→ toast)
│   ├── layout/               LayoutService (menu lateral no mobile)
│   └── notifications/        ToastService + toast-host/
│
├── shared/
│   ├── models/               interfaces da API + enums (1 arquivo por domínio)
│   └── components/           icon, avatar, badges, paginator, spinner,
│                             empty-state, page-loader, confirm-dialog, topbar
│
└── features/                 uma pasta por feature; dentro de cada:
    ├── <feature>.routes.ts   rotas (lazy loadComponent / loadChildren)
    ├── data/                 services HTTP + estado (signals)
    ├── models/               modelos específicos da feature
    ├── pages/                componentes roteados (*.page.ts/html/scss)
    └── ui/                   componentes locais (dialogs, cards…)

    auth · projects · project · board · members · report · shell
```

Todo componente tem `.ts` / `.html` / `.scss` separados (sem template inline).
SCSS em **BEM** (`.bloco__elemento--modificador`); `styles.scss` global só carrega
tokens e primitivos do design system. Ver `frontend/README.md`.

## Padrões

- Um **feature service** (`data/`) por área expõe signals de leitura (`readonly`)
  e métodos de comando; componentes não chamam `HttpClient` direto.
- Quando o mesmo endpoint é consumido por mais de uma feature, o acesso HTTP fica
  num serviço stateless `providedIn: 'root'` e o serviço de estado delega para
  ele. Ex.: `TasksApiService` (endpoints de `/projects/{id}/tasks`) é usado pelo
  `BoardService` (estado do quadro) e pela tela de membros (só leitura, para
  contar tarefas ativas por responsável).
- Estado derivado (tarefas por coluna, contadores) via `computed`.
- Erros de API são normalizados a partir do `ProblemDetail` num único ponto
  (`errorInterceptor`) e exibidos via toast (`ToastService` + `toast-host`, sem
  Angular Material).
- Sem store global; o estado do board vive no `BoardService`, `providedIn` no
  `BoardPage` — recriado ao trocar de projeto.
