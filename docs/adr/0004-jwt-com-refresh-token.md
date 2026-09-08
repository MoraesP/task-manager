# 0004 — JWT com refresh token rotativo e convite que cria conta

Autenticação com **access token JWT** curto (HS256, 15 min) mais **refresh token**
opaco de 7 dias, persistido só como hash, **rotacionado a cada uso**. O aceite de
convite (`/auth/accept-invitation`) cria a conta do convidado quando ela ainda
não existe.

## Considered Options

- **Só access token** (ex.: 8–24 h): mais simples, sem tabela nem endpoints de
  refresh/logout. Mas expiração longa aumenta a janela de um token vazado, e
  expiração curta obriga re-login frequente — ruim para o frontend Angular.
- **Access + refresh** (escolhido): access curto limita o dano de vazamento; o
  refresh renova sem re-autenticar. Rotação + persistência do hash permitem
  revogar (`logout`) e detectar reuso de um refresh já gasto.

## Consequences

- Tabela `refresh_token` (hash, `expiresAt`, `revokedAt`). `POST /auth/refresh`
  emite um novo par e revoga o anterior; `POST /auth/logout` revoga o atual.
- Reuso de um refresh revogado → 401 (indício de roubo).
- Convites: `POST /projects/{id}/invitations` gera um token (retornado na
  resposta — **sem envio de email**, documentado como trade-off).
  `POST /auth/accept-invitation` com `{ token, name?, password? }` cria conta +
  membership, ou só a membership se o email já tem conta.
- O segredo JWT vem de variável de ambiente (`JWT_SECRET`).
