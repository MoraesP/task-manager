package com.taskmanager.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.taskmanager.shared.config.AppProperties;
import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class WipLimitPolicyTest {

    @Mock
    TaskRepository tasks;

    WipLimitPolicy policy;

    private final UUID assignee = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.Security(
                        new AppProperties.Security.Jwt("s", Duration.ofMinutes(15), Duration.ofDays(7)),
                        new AppProperties.Security.Cors("o")),
                new AppProperties.Invitations(Duration.ofDays(7)),
                new AppProperties.Tasks(5),
                new AppProperties.Report(Duration.ofSeconds(60)));
        policy = new WipLimitPolicy(tasks, props);
    }

    @Test
    void allowsWhenBelowLimit() {
        when(tasks.findIdsByAssigneeAndStatus(assignee, TaskStatus.IN_PROGRESS))
                .thenReturn(ids(4));

        assertThatCode(() -> policy.assertCanTakeAnother(assignee, null)).doesNotThrowAnyException();
    }

    @Test
    void rejectsWhenAtLimit() {
        when(tasks.findIdsByAssigneeAndStatus(assignee, TaskStatus.IN_PROGRESS))
                .thenReturn(ids(5));

        assertThatThrownBy(() -> policy.assertCanTakeAnother(assignee, null))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getProperties()).containsKey("tasksInProgress");
                });
    }

    @Test
    void excludedTaskDoesNotCount() {
        UUID current = UUID.randomUUID();
        List<UUID> five = new java.util.ArrayList<>(ids(4));
        five.add(current);
        when(tasks.findIdsByAssigneeAndStatus(assignee, TaskStatus.IN_PROGRESS)).thenReturn(five);

        assertThatCode(() -> policy.assertCanTakeAnother(assignee, current)).doesNotThrowAnyException();
    }

    private static List<UUID> ids(int n) {
        return IntStream.range(0, n).mapToObj(i -> UUID.randomUUID()).toList();
    }
}
