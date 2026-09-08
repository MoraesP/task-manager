package com.taskmanager.task.domain;

import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.taskmanager.shared.error.Errors;

/**
 * Whitelists the sort keys accepted by the task list (RF-41) and maps them to
 * real entity attributes ("priority" sorts by the numeric rank, not the name).
 */
final class TaskSort {

    private static final Map<String, String> ALLOWED = Map.of(
            "priority", "priorityRank",
            "createdAt", "createdAt",
            "deadline", "deadline");

    private static final Sort DEFAULT = Sort.by(Sort.Direction.DESC, "createdAt");

    private TaskSort() {
    }

    static Pageable sanitize(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), DEFAULT);
        }
        Sort mapped = Sort.by(pageable.getSort().stream()
                .map(order -> {
                    String target = ALLOWED.get(order.getProperty());
                    if (target == null) {
                        throw Errors.unprocessable("invalid-sort", "Invalid sort",
                                "Cannot sort tasks by '%s'. Allowed: priority, createdAt, deadline."
                                        .formatted(order.getProperty()));
                    }
                    return new Sort.Order(order.getDirection(), target);
                })
                .toList());
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), mapped);
    }
}
