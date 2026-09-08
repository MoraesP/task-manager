package com.taskmanager.project.infra;

import java.util.List;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.taskmanager.project.domain.MemberTasksPort;

/**
 * Fallback used only until the task feature is wired in. The real adapter
 * (task feature) validates reassignments and the WIP limit; this one assumes the
 * member has no active tasks.
 */
@Configuration
class NoOpMemberTasksPortConfig {

    @Bean
    @ConditionalOnMissingBean(MemberTasksPort.class)
    MemberTasksPort noOpMemberTasksPort() {
        return new MemberTasksPort() {
            @Override
            public void reassignForMemberRemoval(UUID projectId, UUID memberUserId,
                    List<Reassignment> reassignments) {
                // no active tasks assumed
            }
        };
    }
}
