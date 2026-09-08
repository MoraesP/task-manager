# CLAUDE.md

## Skills (`.claude/skills`)

Versionadas em `skills-lock.json`; arquivos reais em `.agents/skills/` (`.claude/skills/` são symlinks).

### `grill-with-docs`
- **Origem:** `mattpocock/skills` — `skills/engineering/grill-with-docs`
- **Função:** entrevista rigorosa para afiar um plano/design, gerando ADRs e glossário em `docs/`.
- **Invocação:** só manual (`/grill-with-docs`); chama a Skill tool para `grilling` e `domain-modeling`.
- **Usar:** antes de implementar uma feature/serviço novo, para pressionar o design e registrar decisões.
- **Nota:** as sub-skills `grilling` e `domain-modeling` não estão instaladas localmente
  (só o wrapper está em `skills-lock.json`); o método vem de `mattpocock/skills`
  (`skills/productivity/grilling`, `skills/engineering/domain-modeling`).

## Especificação do projeto

`docs/` contém a spec-driven documentation do Task Manager (requisitos, regras de
negócio, modelo de domínio, contrato da API, arquitetura, frontend, testes) e os
ADRs em `docs/adr/`. Começar por [docs/README.md](docs/README.md). Glossário
canônico em [docs/glossario.md](docs/glossario.md) — seguir os termos ao nomear.
