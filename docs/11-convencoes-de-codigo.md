# 11 — Convenções de código

Idioma e nomenclatura do código do Task Manager. Complementa o
[glossário](glossario.md) (termos do domínio) e o [08-frontend](08-frontend.md)
(estrutura do Angular).

## Idioma

O código é **em português**, seguindo Clean Code (nomes descritivos, sem
abreviações cifradas). Isso vale para:

- **Variáveis locais e parâmetros** — `const projeto = this.projeto()`, nunca
  `const p = ...`. Parâmetros de lambda também (`membros.map(membro => …)`).
- **Métodos** — de serviço, de regra de negócio, de componente, privados e
  handlers (`criar`, `alterarStatus`, `exigirAdmin`, `aoMudarFiltro`).
- **Campos e signals** expostos a template (`carregando`, `projeto`,
  `resultadoDaBusca`).
- Comentários/Javadoc, mensagens de erro (`ProblemDetail`), logs, `@Tag` do
  OpenAPI, comentários de migration e de teste.

## Fronteira: o que fica em inglês

O **contrato da API** e o vocabulário que o espelha permanecem em inglês, para
não divergir de [06-api-endpoints.md](06-api-endpoints.md) nem quebrar o
frontend/os testes:

| Item | Exemplo |
|---|---|
| Campos JSON de request/response | `assigneeId`, `createdAt`, `totalElements` |
| Valores de enum | `TODO`, `IN_PROGRESS`, `CRITICAL`, `ADMIN` |
| Paths REST e query params | `/accept-invitation`, `?deadlineFrom=` |
| Slugs de tipo de erro | `wip-limit-exceeded`, `invitation-expired` |
| Classes/records de DTO e seus campos | `TaskResponse`, `CreateTaskRequest` |
| Entidades JPA: classe, campos, colunas, getters | `Task`, `getAssigneeId()`, `@Column(name = "assignee_id")` |
| Nomes exigidos/derivados pelo framework | Spring Data (`findByEmailIgnoreCase`), overrides (`handleMethodArgumentNotValid`, `doFilterInternal`) |
| Nomes de tipo do Angular/Java | `HttpClient`, `Observable`, `Instant` |
| Front: interfaces de `shared/models/*`, constantes de enum/label (`STATUS_LABEL`, `ALLOWED_TRANSITIONS`), tokens de `api.config.ts` | — |
| Seletores de componente Angular (`app-*`) e `formControlName` (espelham o DTO) | `<app-task-card>`, `formControlName="assigneeId"` |
| Pacotes Java e nomes de arquivo | seguem o identificador que contêm |

Regra de bolso: **se o dado serializa direto para a API (ou é a chave que o
Spring/Angular resolve), o nome fica em inglês, ponta a ponta.** Todo o resto é
português.

## Exemplos

```ts
// ❌ antes
const p = this.project();
protected onFilter(patch: Partial<TaskFilter>): void { this.board.setFilter(patch); }

// ✅ depois
const projeto = this.projeto();
protected aoMudarFiltro(ajuste: Partial<TaskFilter>): void { this.quadro.definirFiltro(ajuste); }
```

```java
// método de serviço em português; campos do DTO/entidade em inglês
public Task alterarStatus(UUID taskId, UUID actorId, TaskStatus alvo) {
    Task tarefa = carregar(taskId);
    ProjectMembership vinculo = authorization.exigirMembro(tarefa.getProjectId(), actorId);
    ...
}
```

## Histórico

- **2026-09-08** — Adoção do padrão acima. Antes, identificadores (métodos,
  variáveis) eram em inglês; passaram a ser em português, mantida a fronteira da
  API. Backend e frontend varridos; `./mvnw verify` e `ng build` verdes.
