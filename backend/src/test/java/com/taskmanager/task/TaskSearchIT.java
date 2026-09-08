package com.taskmanager.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.taskmanager.support.AbstractIntegrationTest;

class TaskSearchIT extends AbstractIntegrationTest {

    @Test
    void search_matchesPartialTermInTitleOrDescription() throws Exception {
        String token = registerAndLogin("Ana", "searcher@example.com", "password1");
        String projectId = body(mvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Alpha"}""")).andReturn()).get("id").asText();
        String meId = body(mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andReturn()).get("id").asText();

        createTask(token, projectId, "Refactor the payment gateway", "handles Stripe webhooks", meId);
        createTask(token, projectId, "Write onboarding docs", "quickstart guide", meId);

        mvc.perform(get("/api/v1/projects/{p}/tasks/search", projectId)
                        .header("Authorization", "Bearer " + token)
                        .param("q", "paym"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Refactor the payment gateway"));

        mvc.perform(get("/api/v1/projects/{p}/tasks/search", projectId)
                        .header("Authorization", "Bearer " + token)
                        .param("q", "webhook"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mvc.perform(get("/api/v1/projects/{p}/tasks/search", projectId)
                        .header("Authorization", "Bearer " + token)
                        .param("q", "x"))
                .andExpect(status().isBadRequest());
    }

    private void createTask(String token, String projectId, String title, String description, String assigneeId)
            throws Exception {
        mvc.perform(post("/api/v1/projects/{p}/tasks", projectId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"%s","description":"%s","priority":"LOW","assigneeId":"%s"}"""
                                .formatted(title, description, assigneeId)))
                .andExpect(status().isCreated());
    }
}
