# 0007 — Estado no frontend com signals + services, sem NgRx

O frontend Angular 20 gerencia estado com **services usando signals nativos**
(`signal`, `computed`); **RxJS** entra só para operadores de fluxo (debounce da
busca, cancelamento de requisição em voo). Sem NgRx.

## Considered Options

- **NgRx (store + effects + actions)**: previsível e escalável, mas o boilerplate
  (actions, reducers, selectors, effects) é desproporcional a um board com um
  punhado de telas — cairia no "over-engineering" penalizado.
- **NgRx SignalStore**: menos cerimônia, ainda uma dependência e um modelo mental
  a mais para pouca superfície de estado.
- **Services + signals nativos** (escolhido): Angular 20 traz reatividade fina de
  primeira classe; um `BoardService` com signals cobre o caso com menos código.

## Consequences

- Um feature service por área (`AuthService`, `ProjectsService`, `BoardService`,
  `MembersService`) expõe signals `readonly` para leitura e métodos para comando.
- Estado derivado (tarefas por coluna, contadores) via `computed`.
- Componentes não injetam `HttpClient` — só o service da feature.
- `BoardService` é recriado ao trocar de projeto (estado não vaza entre projetos).
- A justificativa desta escolha vai no README (critério "decisões e trade-offs").
