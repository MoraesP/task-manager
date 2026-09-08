package com.taskmanager.shared.event;

import java.util.UUID;

/**
 * Publicado sempre que uma tarefa de um projeto é criada, editada, movida ou
 * excluída. Consumido pela feature de relatório para invalidar o cache (ADR 0006).
 */
public record TaskChangedEvent(UUID projectId) {
}
