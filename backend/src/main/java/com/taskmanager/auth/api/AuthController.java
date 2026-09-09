package com.taskmanager.auth.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskmanager.auth.api.AuthDtos.AcceptInvitationRequest;
import com.taskmanager.auth.api.AuthDtos.LoginRequest;
import com.taskmanager.auth.api.AuthDtos.LogoutRequest;
import com.taskmanager.auth.api.AuthDtos.RefreshRequest;
import com.taskmanager.auth.api.AuthDtos.RegisterRequest;
import com.taskmanager.auth.api.AuthDtos.TokenResponse;
import com.taskmanager.auth.api.AuthDtos.UserResponse;
import com.taskmanager.auth.domain.AuthService;
import com.taskmanager.project.domain.InvitationService;
import com.taskmanager.project.domain.InvitationService.ConviteAceito;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação")
public class AuthController {

    private final AuthService authService;
    private final InvitationService invitationService;

    public AuthController(AuthService authService, InvitationService invitationService) {
        this.authService = authService;
        this.invitationService = invitationService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registrar(@Valid @RequestBody RegisterRequest request) {
        return UserResponse.from(authService.registrar(request.name(), request.email(), request.password()));
    }

    @PostMapping("/login")
    public TokenResponse autenticar(@Valid @RequestBody LoginRequest request) {
        return TokenResponse.from(authService.autenticar(request.email(), request.password()));
    }

    @PostMapping("/refresh")
    public TokenResponse renovar(@Valid @RequestBody RefreshRequest request) {
        return TokenResponse.from(authService.renovar(request.refreshToken()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sair(@Valid @RequestBody LogoutRequest request) {
        authService.sair(request.refreshToken());
    }

    @PostMapping("/accept-invitation")
    public TokenResponse acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        ConviteAceito accepted = invitationService.aceitar(request.token(), request.name(), request.password());
        return TokenResponse.from(authService.emitirParaUsuario(accepted.userId()));
    }
}
