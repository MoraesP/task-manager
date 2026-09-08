package com.taskmanager.task.domain;

import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.taskmanager.shared.error.Errors;

/**
 * Lista branca das chaves de ordenação aceitas pela listagem de tarefas (RF-41),
 * mapeadas para atributos reais da entidade ("priority" ordena pelo rank
 * numérico, não pelo nome).
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
                        throw Errors.unprocessable("invalid-sort", "Ordenação inválida",
                                "Não é possível ordenar tarefas por '%s'. Permitido: priority, createdAt, deadline."
                                        .formatted(order.getProperty()));
                    }
                    return new Sort.Order(order.getDirection(), target);
                })
                .toList());
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), mapped);
    }
}
