# 0002 — Monólito modular package-by-feature, módulo Maven único

O backend é um **monólito modular** organizado **por feature**
(`auth`, `project`, `task`, `report`, `shared`), cada uma com camadas internas
`api` / `domain` / `infra`, num **único módulo Maven** e um único deployable.

## Considered Options

- **Layered clássico** (`controllers/`, `services/`, `repositories/` no topo):
  simples, mas espalha uma feature por vários pacotes e não comunica fronteiras.
- **Hexagonal / ports-and-adapters completo**: fronteiras explícitas, mas o
  volume de interfaces e adapters é over-engineering para o tamanho do desafio —
  penalizado pelo critério "código limpo sem over-engineering".
- **Multi-módulo Maven** (um módulo por feature): fronteira imposta pelo build,
  ao custo de muito `pom.xml` e navegação mais pesada. Descartado — não se paga
  neste escopo.
- **Package-by-feature com camadas internas** (escolhido): coesão por feature,
  separação de responsabilidades visível, sem cerimônia extra.

## Consequences

- A fronteira entre features é convenção, não compilador: features conversam pelo
  **serviço público** da outra, nunca pelo repositório alheio (regra em
  [07-arquitetura.md](../07-arquitetura.md)).
- Migrar para multi-módulo depois é possível, mas não é objetivo declarado —
  ou a modularização é suficiente como está, ou se rediscute com necessidade real.
