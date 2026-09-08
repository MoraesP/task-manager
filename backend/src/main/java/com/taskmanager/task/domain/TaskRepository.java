package com.taskmanager.task.domain;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    @Query("select t.id from Task t where t.assigneeId = :assigneeId and t.status = :status")
    List<UUID> findIdsByAssigneeAndStatus(@Param("assigneeId") UUID assigneeId,
            @Param("status") TaskStatus status);

    List<Task> findByProjectIdAndAssigneeIdAndStatusIn(UUID projectId, UUID assigneeId,
            Collection<TaskStatus> statuses);

    /**
     * Busca textual apoiada pelos índices GIN do pg_trgm (ADR 0005). O padrão
     * {@code %termo%} é acelerado pelos índices de trigramas.
     */
    @Query(value = """
            SELECT * FROM tasks t
            WHERE t.project_id = :projectId
              AND (t.title ILIKE :pattern OR t.description ILIKE :pattern)
            ORDER BY t.created_at DESC
            """,
            countQuery = """
            SELECT count(*) FROM tasks t
            WHERE t.project_id = :projectId
              AND (t.title ILIKE :pattern OR t.description ILIKE :pattern)
            """,
            nativeQuery = true)
    Page<Task> search(@Param("projectId") UUID projectId, @Param("pattern") String pattern, Pageable pageable);

    @Query("select t.status, count(t) from Task t where t.projectId = :projectId group by t.status")
    List<Object[]> countGroupedByStatus(@Param("projectId") UUID projectId);

    @Query("select t.priority, count(t) from Task t where t.projectId = :projectId group by t.priority")
    List<Object[]> countGroupedByPriority(@Param("projectId") UUID projectId);
}
