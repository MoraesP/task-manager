package com.taskmanager.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.databind.JsonNode;
import com.taskmanager.support.AbstractIntegrationTest;

class TaskLifecycleIT extends AbstractIntegrationTest {

    @Test
    void fullFlow_project_invite_task_statusTransitions_report() throws Exception {
        String admin = registerAndLogin("Admin", "admin@example.com", "password1");

        String projectId = createProject(admin, "Alpha");
        String memberId = inviteAndAccept(admin, projectId, "member@example.com");

        // cria uma tarefa atribuída ao membro
        JsonNode task = body(mvc.perform(post("/api/v1/projects/{p}/tasks", projectId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Wire the login screen","description":"OAuth callback handling",
                                 "priority":"HIGH","assigneeId":"%s"}""".formatted(memberId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("TODO"))
                .andReturn());
        String taskId = task.get("id").asText();

        String member = login("member@example.com", "password1");

        changeStatus(member, projectId, taskId, "IN_PROGRESS", status().isOk());
        // DONE -> TODO é rejeitado; primeiro concluir a tarefa
        changeStatus(member, projectId, taskId, "DONE", status().isOk());
        changeStatus(member, projectId, taskId, "TODO", status().isUnprocessableEntity());

        // o relatório reflete uma tarefa DONE
        mvc.perform(get("/api/v1/projects/{p}/report", projectId)
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.byStatus.DONE").value(1))
                .andExpect(jsonPath("$.byStatus.TODO").value(0))
                .andExpect(jsonPath("$.byPriority.HIGH").value(1));
    }

    @Test
    void memberCannotUpdateProject() throws Exception {
        String admin = registerAndLogin("Admin", "admin2@example.com", "password1");
        String projectId = createProject(admin, "Beta");
        inviteAndAccept(admin, projectId, "m2@example.com");
        String member = login("m2@example.com", "password1");

        mvc.perform(put("/api/v1/projects/{p}", projectId)
                        .header("Authorization", "Bearer " + member)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Renamed"}"""))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void nonMemberCannotSeeProject() throws Exception {
        String admin = registerAndLogin("Admin", "admin3@example.com", "password1");
        String projectId = createProject(admin, "Gamma");
        String outsider = registerAndLogin("Out", "out@example.com", "password1");

        mvc.perform(get("/api/v1/projects/{p}", projectId)
                        .header("Authorization", "Bearer " + outsider))
                .andExpect(status().isForbidden());
    }

    @Test
    void wipLimitBlocksSixthInProgressTask() throws Exception {
        String admin = registerAndLogin("Admin", "admin4@example.com", "password1");
        String projectId = createProject(admin, "Delta");
        String adminId = body(mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + admin))
                .andReturn()).get("id").asText();

        for (int i = 0; i < 5; i++) {
            String taskId = createTask(admin, projectId, "Task " + i, adminId);
            changeStatus(admin, projectId, taskId, "IN_PROGRESS", status().isOk());
        }
        String sixth = createTask(admin, projectId, "Task 6", adminId);
        mvc.perform(patch("/api/v1/projects/{p}/tasks/{t}/status", projectId, sixth)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"IN_PROGRESS"}"""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.tasksInProgress").isArray());
    }

    // --- auxiliares ---

    private String createProject(String token, String name) throws Exception {
        return body(mvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","description":"d"}""".formatted(name)))
                .andExpect(status().isCreated())
                .andReturn()).get("id").asText();
    }

    private String inviteAndAccept(String adminToken, String projectId, String email) throws Exception {
        String inviteToken = body(mvc.perform(post("/api/v1/projects/{p}/invitations", projectId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","role":"MEMBER"}""".formatted(email)))
                .andExpect(status().isCreated())
                .andReturn()).get("token").asText();

        mvc.perform(post("/api/v1/auth/accept-invitation").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","name":"Member","password":"password1"}""".formatted(inviteToken)))
                .andExpect(status().isOk());

        return body(mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + login(email, "password1")))
                .andReturn()).get("id").asText();
    }

    private String login(String email, String password) throws Exception {
        return body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s"}""".formatted(email, password)))
                .andReturn()).get("accessToken").asText();
    }

    private String createTask(String token, String projectId, String title, String assigneeId) throws Exception {
        return body(mvc.perform(post("/api/v1/projects/{p}/tasks", projectId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"%s","priority":"MEDIUM","assigneeId":"%s"}""".formatted(title, assigneeId)))
                .andExpect(status().isCreated())
                .andReturn()).get("id").asText();
    }

    private void changeStatus(String token, String projectId, String taskId, String newStatus,
            org.springframework.test.web.servlet.ResultMatcher expected) throws Exception {
        mvc.perform(patch("/api/v1/projects/{p}/tasks/{t}/status", projectId, taskId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"%s"}""".formatted(newStatus)))
                .andExpect(expected);
    }
}
