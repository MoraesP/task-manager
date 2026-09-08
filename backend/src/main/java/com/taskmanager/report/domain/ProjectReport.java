package com.taskmanager.report.domain;

import java.io.Serializable;
import java.util.Map;

/**
 * Task counters for a project, by status and by priority (RF-60). Every enum
 * value is present, defaulting to zero.
 */
public record ProjectReport(Map<String, Long> byStatus, Map<String, Long> byPriority) implements Serializable {
}
