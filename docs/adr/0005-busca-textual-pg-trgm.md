# 0005 — Busca textual com pg_trgm + índice GIN

A busca de tarefas por texto (RF-50) usa a query simples
`WHERE title ILIKE '%termo%' OR description ILIKE '%termo%'`, apoiada pela
extensão **`pg_trgm`** do PostgreSQL com **índices GIN de trigramas** em `title` e
`description`.

## Considered Options

- **`LIKE '%termo%'` sem índice**: uma linha, mas varre a tabela inteira a cada
  busca. Não atende ao "considere performance" da spec com volume.
- **Índice B-tree comum na coluna**: só acelera igualdade e prefixo
  (`termo%`); inútil para casar trecho no meio do texto.
- **Full-text search (`tsvector` + `ts_rank`)**: busca por palavra com stemming e
  ranking, porém adiciona coluna gerada, dicionário de idioma e uma query
  diferente da natural. Poder além do necessário para um campo de busca de board.
- **`pg_trgm` + GIN** (escolhido): mantém a query `ILIKE` natural e legível, e o
  índice passa a servir mesmo com `%` no início. Casa trechos parciais, que é o
  comportamento esperado de uma caixa de busca.

## Consequences

- Migration: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` + um índice GIN
  (`gin_trgm_ops`) por coluna.
- Alvo: < 100 ms para ~100k tarefas por projeto.
- Não há ranking de relevância — resultados ordenados por `createdAt desc`.
  Suficiente para a v1; `tsvector` fica como evolução se relevância for pedida.
