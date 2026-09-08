package com.taskmanager.task.domain;

/**
 * Declared low-to-high so {@link Enum#ordinal()} is the natural priority order
 * used when sorting "by priority".
 */
public enum TaskPriority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
