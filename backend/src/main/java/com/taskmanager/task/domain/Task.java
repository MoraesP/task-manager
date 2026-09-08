package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.UUID;

import com.taskmanager.shared.domain.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "tasks")
public class Task extends BaseEntity {

    @Column(name = "project_id", nullable = false, updatable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority;

    /** Espelho numérico de {@link #priority} para o banco ordenar pela ordem semântica. */
    @Column(name = "priority_rank", nullable = false)
    private short priorityRank;

    @Column(name = "assignee_id", nullable = false)
    private UUID assigneeId;

    @Column
    private Instant deadline;

    protected Task() {
    }

    public Task(UUID projectId, String title, String description, TaskPriority priority,
            UUID assigneeId, Instant deadline) {
        this.projectId = projectId;
        this.title = title;
        this.description = description;
        this.status = TaskStatus.TODO;
        setPriority(priority);
        this.assigneeId = assigneeId;
        this.deadline = deadline;
    }

    public void edit(String title, String description, TaskPriority priority, UUID assigneeId, Instant deadline) {
        this.title = title;
        this.description = description;
        setPriority(priority);
        this.assigneeId = assigneeId;
        this.deadline = deadline;
    }

    public void changeStatus(TaskStatus status) {
        this.status = status;
    }

    public void reassign(UUID assigneeId) {
        this.assigneeId = assigneeId;
    }

    private void setPriority(TaskPriority priority) {
        this.priority = priority;
        this.priorityRank = (short) priority.ordinal();
    }

    public boolean isActive() {
        return status != TaskStatus.DONE;
    }

    public boolean isAssignedTo(UUID userId) {
        return assigneeId.equals(userId);
    }

    public boolean isOverdue(Instant now) {
        return deadline != null && status != TaskStatus.DONE && deadline.isBefore(now);
    }

    public UUID getProjectId() {
        return projectId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public UUID getAssigneeId() {
        return assigneeId;
    }

    public Instant getDeadline() {
        return deadline;
    }
}
