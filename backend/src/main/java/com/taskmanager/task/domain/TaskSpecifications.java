package com.taskmanager.task.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

final class TaskSpecifications {

    private TaskSpecifications() {
    }

    /** Monta o predicado combinando o projeto com os filtros preenchidos (RF-40). */
    static Specification<Task> forProject(UUID projectId, TaskFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("projectId"), projectId));
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            if (filter.priority() != null) {
                predicates.add(cb.equal(root.get("priority"), filter.priority()));
            }
            if (filter.assigneeId() != null) {
                predicates.add(cb.equal(root.get("assigneeId"), filter.assigneeId()));
            }
            if (filter.createdFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.createdFrom()));
            }
            if (filter.createdTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.createdTo()));
            }
            if (filter.deadlineFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("deadline"), filter.deadlineFrom()));
            }
            if (filter.deadlineTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("deadline"), filter.deadlineTo()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
