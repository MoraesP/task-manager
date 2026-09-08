package com.taskmanager.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import com.taskmanager.support.AbstractIntegrationTest;

class AuthFlowIT extends AbstractIntegrationTest {

    @Test
    void register_login_me_refresh_logout() throws Exception {
        String token = registerAndLogin("Ana", "ana@example.com", "password1");

        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana@example.com"));

        MvcResult login = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"ana@example.com","password":"password1"}"""))
                .andReturn();
        String refreshToken = body(login).get("refreshToken").asText();

        MvcResult refreshed = mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"refreshToken":"%s"}""".formatted(refreshToken)))
                .andExpect(status().isOk())
                .andReturn();
        String rotatedRefresh = body(refreshed).get("refreshToken").asText();

        // o refresh token antigo foi rotacionado
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"refreshToken":"%s"}""".formatted(refreshToken)))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"refreshToken":"%s"}""".formatted(rotatedRefresh)))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"refreshToken":"%s"}""".formatted(rotatedRefresh)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithoutTokenIsUnauthorizedProblemJson() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void duplicateRegistrationIsConflict() throws Exception {
        registerAndLogin("Bob", "bob@example.com", "password1");
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Bob 2","email":"bob@example.com","password":"password2"}"""))
                .andExpect(status().isConflict());
    }
}
