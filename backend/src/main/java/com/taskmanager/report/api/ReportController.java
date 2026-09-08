package com.taskmanager.report.api;

import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.taskmanager.report.domain.ReportService;
import com.taskmanager.shared.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/report")
@Tag(name = "Relatórios")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ReportResponse get(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID projectId) {
        var report = reportService.forProject(projectId, user.id());
        return new ReportResponse(report.byStatus(), report.byPriority());
    }

    public record ReportResponse(Map<String, Long> byStatus, Map<String, Long> byPriority) {
    }
}
