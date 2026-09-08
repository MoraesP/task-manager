# 04 — Regras de negócio

Identificadores: `RN-xx`. Toda violação retorna `ProblemDetail` com mensagem
clara e o status indicado.

## Máquina de estados da tarefa

Estados: `TODO`, `IN_PROGRESS`, `DONE`.

```
        ┌───────────────┐
        ▼               │
     ┌──────┐  ──────►  ┌─────────────┐  ──────►  ┌──────┐
     │ TODO │           │ IN_PROGRESS │           │ DONE │
     └──────┘  ◄──────  └─────────────┘  ◄──────  └──────┘
```

| ID | Regra | Status HTTP se violado |
|---|---|---|
| RN-01 | Transições permitidas: `TODO→IN_PROGRESS`, `IN_PROGRESS→DONE`, `IN_PROGRESS→TODO`, `DONE→IN_PROGRESS`. | 422 |
| RN-02 | `DONE→TODO` é proibido. Uma tarefa concluída só pode voltar para `IN_PROGRESS`. | 422 |
| RN-03 | `TODO→DONE` é proibido. A tarefa precisa passar por `IN_PROGRESS` (garante que WIP limit e a regra de CRITICAL sejam sempre exercidos). | 422 |
| RN-04 | Transição para o mesmo estado é no-op idempotente (200, sem efeito). | — |

## WIP limit

| ID | Regra | Status |
|---|---|---|
| RN-10 | Um responsável não pode ter mais de **5** tarefas em `IN_PROGRESS` **somando todos os projetos**. | 409 |
| RN-11 | A checagem ocorre em qualquer operação que resulte em uma tarefa `IN_PROGRESS` atribuída à pessoa: mudança de status para `IN_PROGRESS`, ou reatribuição de uma tarefa `IN_PROGRESS` para ela. | 409 |
| RN-12 | O erro informa o limite (5) e lista os identificadores das tarefas `IN_PROGRESS` que já contam para aquela pessoa. | 409 |

## Prioridade CRITICAL

| ID | Regra | Status |
|---|---|---|
| RN-20 | Fechar uma tarefa (`IN_PROGRESS→DONE`) de prioridade `CRITICAL` só é permitido a um `ADMIN` do projeto. | 403 |
| RN-21 | Demais transições de uma tarefa `CRITICAL` (inclusive reabrir `DONE→IN_PROGRESS`) seguem as regras normais e são permitidas a qualquer membro. | — |
| RN-22 | Alterar a prioridade de uma tarefa para/de `CRITICAL` é permitido a qualquer membro; a restrição incide só no fechamento. | — |

## Responsável (assignee)

| ID | Regra | Status |
|---|---|---|
| RN-30 | Toda tarefa tem um responsável desde a criação (campo obrigatório). | 400 |
| RN-31 | O responsável precisa ser membro ativo do projeto da tarefa, no momento da criação e de qualquer reatribuição. | 422 |
| RN-32 | Ao reatribuir uma tarefa `IN_PROGRESS`, aplica-se o WIP limit ao novo responsável (RN-10). | 409 |

## Pertencimento e papéis

| ID | Regra | Status |
|---|---|---|
| RN-40 | Só membros do projeto acessam seus projetos, tarefas, relatório e busca. | 403 |
| RN-41 | `MEMBER` gerencia apenas tarefas (CRUD de tarefas, mudança de status dentro das regras). | 403 |
| RN-42 | `ADMIN` adicionalmente: edita o projeto, cria/revoga convites, altera papéis de membros, remove membros, e fecha tarefas `CRITICAL`. | 403 |
| RN-43 | O `owner` do projeto é sempre `ADMIN`, não pode ser rebaixado nem removido. Excluir o projeto é exclusivo do `owner`. | 403 |
| RN-44 | Excluir tarefa: `ADMIN` do projeto ou o responsável atual da tarefa. | 403 |

## Convites

| ID | Regra | Status |
|---|---|---|
| RN-50 | Convite tem validade de 7 dias; expirado não pode ser aceito (`EXPIRED`). | 422 |
| RN-51 | Não criar convite `PENDING` duplicado para o mesmo email no mesmo projeto. | 409 |
| RN-52 | Não convidar um email que já é membro do projeto. | 409 |
| RN-53 | Aceitar convite cujo email já tem conta cria apenas a associação; sem conta, cria conta (nome + senha) e a associação. Convite vira `ACCEPTED`. | — |
| RN-54 | Só `ADMIN` do projeto cria, lista e revoga convites. | 403 |

## Remoção de membro

| ID | Regra | Status |
|---|---|---|
| RN-60 | A remoção é sempre iniciada por um `ADMIN`. Um membro sem tarefas ativas não sai do projeto sozinho — permanece até ser removido. | — |
| RN-61 | Se o membro removido tem tarefas ativas (`TODO` ou `IN_PROGRESS`), a requisição deve informar um novo responsável para **cada** uma dessas tarefas. | 422 |
| RN-62 | Cada novo responsável informado precisa ser membro do projeto (RN-31) e não pode estourar o WIP limit (RN-10). | 409 |
| RN-63 | Se qualquer realocação for inválida, **nada é aplicado** (a remoção e todas as reatribuições são uma transação única). | 409 / 422 |
| RN-64 | Tarefas `DONE` do membro removido permanecem atribuídas a ele (registro histórico); não exigem realocação. | — |
| RN-65 | O `owner` nunca é removível (RN-43). | 403 |

## Datas

| ID | Regra |
|---|---|
| RN-70 | `createdAt` é definido na criação e nunca muda. `updatedAt` é atualizado em qualquer alteração da tarefa. |
| RN-71 | `deadline` é opcional e pode estar no passado (permite cadastrar trabalho já atrasado). "Atrasada" é um estado derivado (`deadline < agora` e status ≠ `DONE`), não persistido. |
