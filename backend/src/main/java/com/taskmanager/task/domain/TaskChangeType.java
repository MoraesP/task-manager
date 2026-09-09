package com.taskmanager.task.domain;

/**
 * Tipo de alteração registrada no histórico da tarefa (audit log). Uma linha de
 * {@link TaskChange} por campo alterado.
 *
 * <p>Exceção deliberada à convenção "valores de enum em inglês": os valores foram
 * definidos em português a pedido, pois são o vocabulário do histórico exibido ao
 * usuário e não fazem parte de nenhum contrato pré-existente.
 */
public enum TaskChangeType {
    ALTERACAO_TITULO,
    ALTERACAO_DESCRICAO,
    ALTERACAO_PRIORIDADE,
    ALTERACAO_PRAZO,
    ALTERACAO_RESPONSAVEL,
    ALTERACAO_STATUS
}
