# Documentação — Task Manager

Sistema de gerenciamento de tarefas para equipes de desenvolvimento.
Especificação orientada a documento (spec-driven), derivada do desafio técnico e
das decisões tomadas na sessão de refinamento.

## Índice

| Arquivo | Conteúdo |
|---|---|
| [01-overview.md](01-overview.md) | Contexto, escopo, stack e resumo das decisões-chave |
| [02-requisitos-funcionais.md](02-requisitos-funcionais.md) | Requisitos funcionais do backend |
| [03-requisitos-nao-funcionais.md](03-requisitos-nao-funcionais.md) | Requisitos técnicos, qualidade e restrições |
| [04-regras-de-negocio.md](04-regras-de-negocio.md) | Máquina de estados, WIP limit, autorização, remoção de membros |
| [05-modelo-de-dominio.md](05-modelo-de-dominio.md) | Entidades, atributos, relacionamentos e enums |
| [06-api-endpoints.md](06-api-endpoints.md) | Contrato REST completo |
| [07-arquitetura.md](07-arquitetura.md) | Estilo arquitetural, camadas e estrutura de pacotes |
| [08-frontend.md](08-frontend.md) | Requisitos e arquitetura do frontend Angular |
| [09-estrategia-de-testes.md](09-estrategia-de-testes.md) | O que testar e por quê |
| [10-checklist-desenvolvimento.md](10-checklist-desenvolvimento.md) | Estado de implementação de cada requisito (RF/RNF/RN/FE) vs. código |
| [11-convencoes-de-codigo.md](11-convencoes-de-codigo.md) | Idioma e nomenclatura: código em português, contrato da API em inglês |
| [glossario.md](glossario.md) | Vocabulário canônico do domínio |
| [adr/](adr/) | Architecture Decision Records |

## Convenção de status dos requisitos

- **OBRIGATÓRIO** — exigido pela especificação, entra na v1.
- **DIFERENCIAL** — opcional na especificação, decidido para entrar na v1.
- **ADIADO** — reconhecido, não implementado na v1; registrado no README final
  em "o que eu faria diferente com mais tempo".
