package com.taskmanager.task.domain;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read-only task aggregates exposed to the report feature.
 */
@Service
public class TaskStatistics {

    private final TaskRepository tasks;

    public TaskStatistics(TaskRepository tasks) {
        this.tasks = tasks;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(UUID projectId) {
        return toMap(tasks.countGroupedByStatus(projectId));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByPriority(UUID projectId) {
        return toMap(tasks.countGroupedByPriority(projectId));
    }

    private static Map<String, Long> toMap(java.util.List<Object[]> rows) {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            result.put(((Enum<?>) row[0]).name(), (Long) row[1]);
        }
        return result;
    }
}
