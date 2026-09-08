package com.taskmanager.project.domain;

/**
 * A project plus the calling user's role in it and its member count, as returned
 * by the project endpoints.
 */
public record ProjectDetail(Project project, Role callerRole, long memberCount) {
}
