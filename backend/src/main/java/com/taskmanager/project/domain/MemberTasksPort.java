package com.taskmanager.project.domain;

import java.util.List;
import java.util.UUID;

/**
 * Porta de saída que a feature de projeto usa para delegar o tratamento das
 * tarefas quando um membro é removido (RN-60..65). Implementada pela feature de
 * tarefa, para que a feature de projeto nunca dependa dos detalhes de tarefa.
 */
public interface MemberTasksPort {

    /**
     * Realoca toda tarefa ativa do membro no projeto. Deve lançar exceção
     * (revertendo a transação corrente) se faltar uma realocação, se o novo
     * responsável não for membro do projeto ou se o WIP limit for estourado.
     */
    void reassignForMemberRemoval(UUID projectId, UUID memberUserId, List<Reassignment> reassignments);

    record Reassignment(UUID taskId, UUID newAssigneeId) {
    }
}
