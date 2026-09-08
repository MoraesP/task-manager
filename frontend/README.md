# Task Manager — Frontend

Angular 20 (standalone, sem NgModules). Consome a API REST do backend.

## Rodar

```bash
npm install
npm start          # dev server em http://localhost:4200
```

O dev server faz proxy de `/api` para `http://localhost:8080` (ver
`proxy.conf.json`), então o backend precisa estar no ar.

```bash
npm run build      # build de produção em dist/
```

## Arquitetura

- **Estado**: services com signals nativos (`signal`, `computed`); RxJS só para
  operadores de fluxo (debounce da busca).
- **`src/app/core/`**: models tipados, `AuthService`, interceptors (Authorization +
  refresh automático em 401; erro → toast a partir do `ProblemDetail`), guards,
  `ToastService`, `LayoutService`.
- **Features**: `auth/`, `projects/`, `shell/` (sidebar + topbar), `project/`
  (layout + configurações), `board/` (quadro, DnD, drawer de tarefa, filtros,
  busca), `members/` (papéis, convites, remoção com reatribuição), `report/`.
- **`src/styles.scss`**: design system global ("clara e arejada"), espelha
  `../design/_head.html`.
- Drag-and-drop: Angular CDK. Diálogos e drawer: CDK Dialog + CDK Overlay.

Rotas em português (`/entrar`, `/cadastro`, `/convite`, `/projetos`,
`/projetos/:id/quadro|relatorio|membros|configuracoes`), lazy com `loadComponent`.
