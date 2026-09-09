# Task Manager — Frontend

Angular 20 (standalone, sem NgModules). Consome a API REST do backend.

## Rodar

```bash
npm install
npm start          # dev server em http://localhost:4200
npm run build      # build de produção em dist/
npm test           # testes unitários (Jest)
```

O dev server faz proxy de `/api` para `http://localhost:8080` (`proxy.conf.json`),
então o backend precisa estar no ar.

## Arquitetura

Três camadas, com aliases de path (`@core/*`, `@shared/*`, `@features/*`).

```
src/app/
├── core/                  infraestrutura, sem UI de domínio
│   ├── auth/              AuthService (signals) + guards
│   ├── http/             api.config (base + HttpContextTokens), problem-detail
│   ├── interceptors/     auth (Authorization + refresh em 401) · error (→ toast)
│   ├── layout/           LayoutService (menu lateral no mobile)
│   └── notifications/    ToastService + toast-host
│
├── shared/                reutilizável entre features
│   ├── models/           interfaces da API + enums, um arquivo por domínio
│   └── components/        icon, avatar, badges, paginator, spinner,
│                          empty-state, page-loader, confirm-dialog, topbar
│
└── features/              uma pasta por feature; dentro de cada:
    ├── <feature>.routes.ts   rotas (lazy loadComponent / loadChildren)
    ├── data/                 services HTTP + estado (signals)
    ├── models/               modelos específicos da feature
    ├── pages/                componentes roteados (*.page.ts/html/scss)
    └── ui/                   componentes locais da feature (dialogs, cards…)

    auth · projects · project · board · members · report · shell
```

Regras: `core` não importa de `features`; `features` importam de `core` e
`shared`; `shared` não importa de `features`.

- **Sem template inline**: todo componente tem `.ts`, `.html` e `.scss` separados.
- **Estado**: services com signals nativos; RxJS só para operadores de fluxo
  (debounce da busca). O `BoardService` é `providedIn` no `BoardPage` — recriado
  ao trocar de projeto (ADR 0007).
- **SCSS**: nomenclatura **BEM** (`.bloco__elemento--modificador`). O
  `styles.scss` global carrega apenas os tokens e primitivos do design system
  (`.btn`, `.input`, `.field`, `.card`, `.badge`, `.callout`, `.modal`, `.drawer`,
  `.tabs`) — espelha `../design/_head.html`.
- **Drag-and-drop**: Angular CDK. **Diálogos/drawer**: CDK Dialog + CDK Overlay.

Rotas em português: `/entrar`, `/cadastro`, `/convite`, `/projetos`,
`/projetos/:id/{quadro|relatorio|membros|configuracoes}`.

## Testes

**Jest** + `jest-preset-angular` (`jest.config.js`, `setup-jest.ts`). Sem meta de
cobertura — só as regras essenciais:

- `shared/models/enums.spec.ts` — máquina de estados da tarefa no cliente (RN-01..04).
- `features/board/ui/task-card/task-card.component.spec.ts` — o teste de componente
  do board: render dos dados, o menu "mover para" só com transições válidas, e a
  emissão dos eventos (`mover`, `abrir`, `excluir`).
- `core/http/problem-detail.spec.ts` — `mensagemDeErro` (ponto único de
  normalização do `ProblemDetail`).
- `features/board/data/board.service.spec.ts` — estado do quadro: agrupamento por
  coluna, move otimista + revert, `criar` / `atualizar` / `excluir`.

E2E (Playwright) não foi feito — opcional pela spec.
