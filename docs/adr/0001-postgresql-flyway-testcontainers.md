# 0001 — PostgreSQL com Flyway e Testcontainers

A especificação aceita "H2 para simplificar ou PostgreSQL". Escolhemos
**PostgreSQL** como banco real, com **Flyway** para versionar o schema e
**Testcontainers** para os testes de integração rodarem contra um Postgres real.

## Considered Options

- **H2 em memória/arquivo**: zero infra, roda com um `java -jar`. Mas a busca
  textual com "considere performance" (RF-50) só teria `LIKE` sem índice útil, e
  dialetos divergem entre H2 e o Postgres de produção.
- **PostgreSQL**: exige Docker local, mas habilita `pg_trgm` (ver
  [ADR 0005](0005-busca-textual-pg-trgm.md)), tipos ricos (`uuid`, `timestamptz`)
  e paridade dev/prod.

## Consequences

- É preciso Docker para rodar o projeto. Mitigação: `docker-compose.yml` de poucas
  linhas sobe só o banco; o README documenta o passo. O usuário roda Postgres via
  Colima.
- Os testes de integração ficam mais lentos (sobem um container) porém fiéis.
- `ddl-auto=validate`: o schema é propriedade das migrations Flyway, não do
  Hibernate.
