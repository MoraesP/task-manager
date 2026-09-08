package com.taskmanager.task.domain;

/**
 * Declarado do menor para o maior, de modo que {@link Enum#ordinal()} seja a
 * ordem natural de prioridade usada na ordenação "por prioridade".
 */
public enum TaskPriority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
