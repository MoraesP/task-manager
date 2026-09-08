package com.taskmanager.project.domain;

/**
 * Um projeto somado ao papel do usuário chamador nele e à sua contagem de
 * membros, como retornado pelos endpoints de projeto.
 */
public record ProjectDetail(Project project, Role callerRole, long memberCount) {
}
