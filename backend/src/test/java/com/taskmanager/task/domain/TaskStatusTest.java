package com.taskmanager.task.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TaskStatusTest {

    @Test
    void allowedTransitions() {
        assertThat(TaskStatus.TODO.canTransitionTo(TaskStatus.IN_PROGRESS)).isTrue();
        assertThat(TaskStatus.IN_PROGRESS.canTransitionTo(TaskStatus.DONE)).isTrue();
        assertThat(TaskStatus.IN_PROGRESS.canTransitionTo(TaskStatus.TODO)).isTrue();
        assertThat(TaskStatus.DONE.canTransitionTo(TaskStatus.IN_PROGRESS)).isTrue();
    }

    @Test
    void blockedTransitions() {
        assertThat(TaskStatus.DONE.canTransitionTo(TaskStatus.TODO)).isFalse();
        assertThat(TaskStatus.TODO.canTransitionTo(TaskStatus.DONE)).isFalse();
    }

    @Test
    void priorityRankFollowsSeverity() {
        assertThat(TaskPriority.LOW.ordinal()).isLessThan(TaskPriority.MEDIUM.ordinal());
        assertThat(TaskPriority.HIGH.ordinal()).isLessThan(TaskPriority.CRITICAL.ordinal());
    }
}
