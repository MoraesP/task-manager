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

    static Pageable sanear(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), DEFAULT);
        }
        Sort mapeado = Sort.by(pageable.getSort().stream()
                .map(ordem -> {
                    String alvo = ALLOWED.get(ordem.getProperty());
                    if (alvo == null) {
                        throw Errors.naoProcessavel("invalid-sort", "Ordenação inválida",
                                "Não é possível ordenar tarefas por '%s'. Permitido: priority, createdAt, deadline."
                                        .formatted(ordem.getProperty()));
                    }
                    return new Sort.Order(ordem.getDirection(), alvo);
                })
                .toList());
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), mapeado);
    }
}
