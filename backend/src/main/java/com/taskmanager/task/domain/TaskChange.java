package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.UUID;

import com.taskmanager.shared.domain.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Uma alteração de campo no histórico de uma tarefa: tipo, valor antigo e novo,
 * quem fez e quando. Registro imutável — só é criado, nunca editado.
 * As alterações de um mesmo salvamento compartilham o {@code occurredAt}.
 */
@Entity
@Table(name = "task_change")
public class TaskChange extends BaseEntity {

    @Column(name = "task_id", nullable = false, updatable = false)
    private UUID taskId;

    @Column(name = "author_id", nullable = false, updatable = false)
    private UUID authorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, updatable = false)
    private TaskChangeType type;

    @Column(name = "old_value", updatable = false)
    private String oldValue;

    @Column(name = "new_value", updatable = false)
    private String newValue;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected TaskChange() {
    }

    private TaskChange(UUID taskId, UUID authorId, TaskChangeType type, String oldValue,
            String newValue, Instant occurredAt) {
        this.taskId = taskId;
        this.authorId = authorId;
        this.type = type;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.occurredAt = occurredAt;
    }

    public static TaskChange de(UUID taskId, UUID authorId, TaskChangeType type, String valorAntigo,
            String valorNovo, Instant quando) {
        return new TaskChange(taskId, authorId, type, valorAntigo, valorNovo, quando);
    }

    public UUID getTaskId() {
        return taskId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public TaskChangeType getType() {
        return type;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
