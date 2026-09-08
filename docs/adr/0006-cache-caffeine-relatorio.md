# 0006 — Cache Caffeine só no relatório, invalidação por evicção

O endpoint de relatório (RF-60) é cacheado com **Spring Cache + Caffeine**
(in-process), chave = `projectId`, TTL de segurança de 60 s, e **evicção
explícita** (`@CacheEvict`) em qualquer escrita de tarefa do projeto.

## Considered Options

- **Sem cache**: o relatório é uma query `GROUP BY`; aceitável, mas é o endpoint
  mais caro e o mais chamado por um board que exibe contadores.
- **Caffeine via Spring Cache** (escolhido): zero infra, invalidação trivial de
  raciocinar (evict por `projectId`), adequado a deploy single-instance.
- **Redis**: cache distribuído, sobrevive a restart e serve várias instâncias.
  Não há multi-instância no escopo — traria um container só para isso.
- **Hibernate 2nd-level cache**: invalidação implícita difícil de auditar, risco
  de staleness sutil.
- **HTTP `ETag`/`Cache-Control`**: complementar (pode ser somado depois), mas não
  poupa o cálculo no primeiro hit nem entre clientes distintos.

## Estratégia de invalidação

Escrita que muda contadores → `@CacheEvict(key = projectId)`:

- criar, editar (mudança de status/prioridade) e excluir tarefa;
- realocação de tarefas na remoção de membro.

O TTL de 60 s é rede de segurança contra um caminho de escrita esquecido, não o
mecanismo principal.

## Consequences

- Leituras repetidas do relatório do mesmo projeto sem escritas no meio são
  servidas da memória.
- Ao escalar para múltiplas instâncias, trocar o cache manager por Redis sem tocar
  nos serviços (a abstração do Spring Cache isola isso).
