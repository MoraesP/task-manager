# 0003 — Papel por projeto (ProjectMembership), sem papel global

Os papéis `ADMIN` e `MEMBER` são definidos **por projeto**, numa entidade
`ProjectMembership { project, user, role }`. Não existe papel global de usuário.
O `owner` do projeto é `ADMIN` implícito e imutável.

## Contexto

A spec pede "pelo menos dois perfis: ADMIN (gerencia projetos e membros) e MEMBER
(gerencia apenas tarefas)" e "um projeto tem um dono e pode ter N membros". Isso é
ambíguo entre um papel de sistema e um papel por projeto.

## Decisão e razão

Papel por projeto. A mesma pessoa pode ser `ADMIN` de um projeto que criou e
`MEMBER` de outro para o qual foi convidada. "ADMIN gerencia projetos e membros"
lê-se como *daquele* projeto. Um `SYSTEM_ADMIN` global não tem requisito que o
justifique (não há gestão cross-projeto na spec).

## Consequences

- Toda autorização parte de: "o solicitante tem `ProjectMembership` neste
  projeto? qual `role`?". Sem membership → 403.
- Registro (`/auth/register`) cria um `User` sem nenhum projeto. Qualquer usuário
  pode criar projetos e, ao criar, vira `owner` + `ADMIN`.
- Entrar num projeto é sempre via convite aceito (ver
  [ADR 0004](0004-jwt-com-refresh-token.md) para o fluxo de aceite que cria conta).
- O `owner` não pode ser rebaixado nem removido; excluir o projeto é exclusivo
  dele.
