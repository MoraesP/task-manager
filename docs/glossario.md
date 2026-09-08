# Glossário

Vocabulário canônico do domínio. Só termos específicos deste contexto — conceitos
gerais de programação não entram. Nomes de classes, tabelas, endpoints e variáveis
seguem estes termos.

## Pessoas e acesso

**User**:
Pessoa com credenciais (email + senha) que autentica no sistema. Não tem papel
global — o que pode fazer depende do projeto.
_Evitar_: Conta, Perfil, Usuário do sistema

**Project**:
Espaço de trabalho que agrupa tarefas e membros. Tem um dono e N membros.
_Evitar_: Workspace, Board, Time

**Owner**:
O `User` que criou o projeto. É sempre `ADMIN` dele, não pode ser rebaixado nem
removido, e é o único que pode excluir o projeto.
_Evitar_: Criador, Responsável pelo projeto

**Member**:
`User` que participa de um projeto, com um papel. Passa a existir ao aceitar um
convite.
_Evitar_: Participante, Colaborador

**Membership**:
O vínculo entre um `User` e um `Project`, carregando o papel. Entidade
`ProjectMembership`.
_Evitar_: Associação, Vínculo, Participação

**Role**:
Papel de um membro **dentro de um projeto**: `ADMIN` (gerencia projeto, membros e
convites; fecha tarefas CRITICAL) ou `MEMBER` (gerencia apenas tarefas).
_Evitar_: Permissão, Nível de acesso, Grupo

**Invitation**:
Oferta de membership para um email, com papel e prazo de 7 dias. Aceitar cria a
conta (se necessário) e a membership.
_Evitar_: Convocação, Solicitação, Pedido de acesso

## Tarefas

**Task**:
Unidade de trabalho dentro de um projeto: título, descrição, status, prioridade,
prazo e responsável.
_Evitar_: Card, Item, Ticket, Issue, Atividade

**Assignee**:
O `User` responsável por uma tarefa. Obrigatório desde a criação; sempre membro
do projeto.
_Evitar_: Dono da tarefa, Executor, Atribuído

**Status**:
Estágio da tarefa no fluxo: `TODO`, `IN_PROGRESS`, `DONE`. Governado por uma
máquina de estados.
_Evitar_: Estado, Fase, Coluna, Situação

**Priority**:
Urgência da tarefa: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. `CRITICAL` restringe quem
pode fechar a tarefa.
_Evitar_: Severidade, Importância, Peso

**Deadline**:
Data-limite opcional da tarefa. Uma tarefa é "atrasada" (estado derivado, não
persistido) quando `deadline` passou e o status não é `DONE`.
_Evitar_: Prazo final, Vencimento, Data de entrega, Due date

**WIP limit**:
Regra que impede um `Assignee` de ter mais de 5 tarefas `IN_PROGRESS`
simultâneas, contando todos os projetos.
_Evitar_: Limite de tarefas, Quota, Capacidade

**Reassignment**:
Troca do `Assignee` de uma tarefa. Exigida em lote quando um membro com tarefas
ativas é removido do projeto.
_Evitar_: Transferência, Realocação, Redistribuição

**Report**:
Resposta agregada com os contadores de tarefas de um projeto por status e por
prioridade.
_Evitar_: Dashboard, Resumo, Estatísticas, Métricas

## Autenticação

**Access token**:
JWT de curta duração (15 min) enviado em cada requisição.
_Evitar_: Bearer token, Token de sessão, JWT (sozinho, ambíguo)

**Refresh token**:
Credencial opaca de longa duração (7 dias), guardada só como hash, trocável por um
novo par de tokens. Rotacionada a cada uso.
_Evitar_: Token de renovação, Long-lived token
