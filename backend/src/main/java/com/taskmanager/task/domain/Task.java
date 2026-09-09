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

    /** Quem criou a tarefa. Nulo apenas em tarefas anteriores ao histórico (V6). */
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    protected Task() {
    }

    public Task(UUID projectId, String title, String description, TaskPriority priority,
            UUID assigneeId, Instant deadline, UUID createdById) {
        this.projectId = projectId;
        this.title = title;
        this.description = description;
        this.status = TaskStatus.TODO;
        definirPrioridade(priority);
        this.assigneeId = assigneeId;
        this.deadline = deadline;
        this.createdById = createdById;
    }

    public void editar(String title, String description, TaskPriority priority, UUID assigneeId, Instant deadline) {
        this.title = title;
        this.description = description;
        definirPrioridade(priority);
        this.assigneeId = assigneeId;
        this.deadline = deadline;
    }

    public void alterarStatus(TaskStatus status) {
        this.status = status;
    }

    public void realocar(UUID assigneeId) {
        this.assigneeId = assigneeId;
    }

    private void definirPrioridade(TaskPriority priority) {
        this.priority = priority;
        this.priorityRank = (short) priority.ordinal();
    }

    public boolean estaAtivo() {
        return status != TaskStatus.DONE;
    }

    public boolean ehResponsavelPor(UUID userId) {
        return assigneeId.equals(userId);
    }

    public boolean estaAtrasada(Instant agora) {
        return deadline != null && status != TaskStatus.DONE && deadline.isBefore(agora);
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

    public UUID getCreatedById() {
        return createdById;
    }
}
