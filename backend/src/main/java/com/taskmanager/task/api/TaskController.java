package com.taskmanager.task.api;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskmanager.shared.security.AuthenticatedUser;
import com.taskmanager.shared.web.PageResponse;
import com.taskmanager.task.api.TaskDtos.ChangeStatusRequest;
import com.taskmanager.task.api.TaskDtos.CreateTaskRequest;
import com.taskmanager.task.api.TaskDtos.TaskResponse;
import com.taskmanager.task.api.TaskDtos.UpdateTaskRequest;
import com.taskmanager.task.domain.TaskFilter;
import com.taskmanager.task.domain.TaskPriority;
import com.taskmanager.task.domain.TaskService;
import com.taskmanager.task.domain.TaskStatus;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/tasks")
@Tag(name = "Tarefas")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class TaskController {

    private final TaskService taskService;
    private final TaskResponseAssembler assembler;

    public TaskController(TaskService taskService, TaskResponseAssembler assembler) {
        this.taskService = taskService;
        this.assembler = assembler;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse criar(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId, @Valid @RequestBody CreateTaskRequest request) {
        return assembler.paraResposta(taskService.criar(projectId, usuario.id(), request.title(),
                request.description(), request.priority(), request.assigneeId(), request.deadline()));
    }

    @GetMapping
    public PageResponse<TaskResponse> listar(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant deadlineFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant deadlineTo,
            @PageableDefault(size = 20) Pageable pageable) {
        TaskFilter filter = new TaskFilter(status, priority, assigneeId,
                createdFrom, createdTo, deadlineFrom, deadlineTo);
        return assembler.paraPagina(taskService.listar(projectId, usuario.id(), filter, pageable));
    }

    @GetMapping("/search")
    public PageResponse<TaskResponse> buscar(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId,
            @RequestParam @Size(min = 2, max = 255) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return assembler.paraPagina(taskService.buscar(projectId, usuario.id(), q, pageable));
    }

    @GetMapping("/{taskId}")
    public TaskResponse obter(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId, @PathVariable UUID taskId) {
        return assembler.paraResposta(taskService.obterParaMembro(taskId, usuario.id()));
    }

    @PutMapping("/{taskId}")
    public TaskResponse atualizar(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId, @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        return assembler.paraResposta(taskService.editar(taskId, usuario.id(), request.title(),
                request.description(), request.priority(), request.assigneeId(), request.deadline()));
    }

    @PatchMapping("/{taskId}/status")
    public TaskResponse alterarStatus(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId, @PathVariable UUID taskId,
            @Valid @RequestBody ChangeStatusRequest request) {
        return assembler.paraResposta(taskService.alterarStatus(taskId, usuario.id(), request.status()));
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedUser usuario,
            @PathVariable UUID projectId, @PathVariable UUID taskId) {
        taskService.delete(taskId, usuario.id());
    }
}
