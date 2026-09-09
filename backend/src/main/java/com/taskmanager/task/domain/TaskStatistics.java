package com.taskmanager.task.domain;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Agregados de tarefas somente leitura expostos à feature de relatório.
 */
@Service
public class TaskStatistics {

    private final TaskRepository tasks;

    public TaskStatistics(TaskRepository tasks) {
        this.tasks = tasks;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> contarPorStatus(UUID projectId) {
        return toMap(tasks.contarAgrupadasPorStatus(projectId));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> contarPorPrioridade(UUID projectId) {
        return toMap(tasks.contarAgrupadasPorPrioridade(projectId));
    }

    private static Map<String, Long> toMap(java.util.List<Object[]> linhas) {
        Map<String, Long> resultado = new HashMap<>();
        for (Object[] linha : linhas) {
            resultado.put(((Enum<?>) linha[0]).name(), (Long) linha[1]);
        }
        return resultado;
    }
}
