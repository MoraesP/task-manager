package com.taskmanager.report.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.taskmanager.task.domain.TaskStatistics;

@ExtendWith(MockitoExtension.class)
class ProjectReportCacheTest {

    @Mock
    TaskStatistics taskStatistics;
    @InjectMocks
    ProjectReportCache cache;

    @Test
    void compute_fillsEveryEnumValueDefaultingToZero() {
        UUID projectId = UUID.randomUUID();
        when(taskStatistics.contarPorStatus(projectId)).thenReturn(Map.of("DONE", 3L));
        when(taskStatistics.contarPorPrioridade(projectId)).thenReturn(Map.of("HIGH", 2L));

        ProjectReport report = cache.calcular(projectId);

        assertThat(report.byStatus()).containsExactlyInAnyOrderEntriesOf(
                Map.of("TODO", 0L, "IN_PROGRESS", 0L, "DONE", 3L));
        assertThat(report.byPriority()).containsExactlyInAnyOrderEntriesOf(
                Map.of("LOW", 0L, "MEDIUM", 0L, "HIGH", 2L, "CRITICAL", 0L));
    }
}
