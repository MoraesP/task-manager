package com.taskmanager.task.domain;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskChangeRepository extends JpaRepository<TaskChange, UUID> {

    /** Mais recentes primeiro. */
    List<TaskChange> findByTaskIdOrderByOccurredAtDescIdDesc(UUID taskId);
}
