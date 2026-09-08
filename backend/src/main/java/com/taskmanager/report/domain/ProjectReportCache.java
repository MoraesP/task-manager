package com.taskmanager.report.domain;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.config.CacheConfig;
import com.taskmanager.shared.event.TaskChangedEvent;
import com.taskmanager.task.domain.TaskPriority;
import com.taskmanager.task.domain.TaskStatistics;
import com.taskmanager.task.domain.TaskStatus;

/**
 * Computes and caches the per-project report. Invalidation is explicit: every
 * {@link TaskChangedEvent} evicts that project's entry (ADR 0006). The cache TTL
 * is only a safety net.
 */
@Component
public class ProjectReportCache {

    private final TaskStatistics taskStatistics;

    public ProjectReportCache(TaskStatistics taskStatistics) {
        this.taskStatistics = taskStatistics;
    }

    @Cacheable(cacheNames = CacheConfig.PROJECT_REPORT_CACHE, key = "#projectId")
    @Transactional(readOnly = true)
    public ProjectReport compute(UUID projectId) {
        return new ProjectReport(
                fill(taskStatistics.countByStatus(projectId), names(TaskStatus.values())),
                fill(taskStatistics.countByPriority(projectId), names(TaskPriority.values())));
    }

    @CacheEvict(cacheNames = CacheConfig.PROJECT_REPORT_CACHE, key = "#event.projectId()")
    @EventListener
    public void onTaskChanged(TaskChangedEvent event) {
        // annotation does the eviction
    }

    private static Map<String, Long> fill(Map<String, Long> counts, String[] allKeys) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (String key : allKeys) {
            result.put(key, counts.getOrDefault(key, 0L));
        }
        return result;
    }

    private static String[] names(Enum<?>[] values) {
        String[] names = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            names[i] = values[i].name();
        }
        return names;
    }
}
