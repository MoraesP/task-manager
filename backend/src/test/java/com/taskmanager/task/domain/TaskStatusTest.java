package com.taskmanager.task.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TaskStatusTest {

    @Test
    void allowedTransitions() {
        assertThat(TaskStatus.TODO.podeTransicionarPara(TaskStatus.IN_PROGRESS)).isTrue();
        assertThat(TaskStatus.IN_PROGRESS.podeTransicionarPara(TaskStatus.DONE)).isTrue();
        assertThat(TaskStatus.IN_PROGRESS.podeTransicionarPara(TaskStatus.TODO)).isTrue();
        assertThat(TaskStatus.DONE.podeTransicionarPara(TaskStatus.IN_PROGRESS)).isTrue();
    }

    @Test
    void blockedTransitions() {
        assertThat(TaskStatus.DONE.podeTransicionarPara(TaskStatus.TODO)).isFalse();
        assertThat(TaskStatus.TODO.podeTransicionarPara(TaskStatus.DONE)).isFalse();
    }

    @Test
    void priorityRankFollowsSeverity() {
        assertThat(TaskPriority.LOW.ordinal()).isLessThan(TaskPriority.MEDIUM.ordinal());
        assertThat(TaskPriority.HIGH.ordinal()).isLessThan(TaskPriority.CRITICAL.ordinal());
    }
}
