package com.taskmanager.report.domain;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.taskmanager.project.domain.ProjectAuthorization;

@Service
public class ReportService {

    private final ProjectAuthorization authorization;
    private final ProjectReportCache cache;

    public ReportService(ProjectAuthorization authorization, ProjectReportCache cache) {
        this.authorization = authorization;
        this.cache = cache;
    }

    public ProjectReport porProjeto(UUID projectId, UUID actorId) {
        authorization.exigirMembro(projectId, actorId);
        return cache.calcular(projectId);
    }
}
