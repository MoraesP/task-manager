package com.taskmanager.task.domain;

import java.util.Map;
import java.util.Set;

/**
 * Estados do ciclo de vida da tarefa e as transições permitidas entre eles
 * (RN-01..03).
 */
public enum TaskStatus {

    TODO,
    IN_PROGRESS,
    DONE;

    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED = Map.of(
            TODO, Set.of(IN_PROGRESS),
            IN_PROGRESS, Set.of(TODO, DONE),
            DONE, Set.of(IN_PROGRESS));

    public boolean podeTransicionarPara(TaskStatus alvo) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(alvo);
    }
}
