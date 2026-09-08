package com.taskmanager.report.domain;

import java.io.Serializable;
import java.util.Map;

/**
 * Contadores de tarefas de um projeto, por status e por prioridade (RF-60).
 * Todos os valores do enum aparecem, com zero como padrão.
 */
public record ProjectReport(Map<String, Long> byStatus, Map<String, Long> byPriority) implements Serializable {
}
