package com.taskmanager.auth.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanager.shared.error.Errors;
import com.taskmanager.shared.security.JwtService;

@Service
public class AuthService {

    private final UserService users;
    private final RefreshTokenService refreshTokens;
    private final JwtService jwtService;

    public AuthService(UserService users, RefreshTokenService refreshTokens, JwtService jwtService) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.jwtService = jwtService;
    }

    @Transactional
    public User registrar(String name, String email, String senhaBruta) {
        return users.criar(name, email, senhaBruta);
    }

    @Transactional
    public AuthTokens autenticar(String email, String senhaBruta) {
        User usuario = users.procurarPorEmail(email)
                .filter(candidato -> users.senhaConfere(candidato, senhaBruta))
                .orElseThrow(() -> Errors.naoAutenticado("E-mail ou senha inválidos."));
        return emitirPara(usuario);
    }

    @Transactional
    public AuthTokens renovar(String refreshTokenBruto) {
        RefreshToken consumido = refreshTokens.consumir(refreshTokenBruto);
        User usuario = users.buscarPorId(consumido.getUserId());
        return emitirPara(usuario);
    }

    @Transactional
    public void sair(String refreshTokenBruto) {
        refreshTokens.revogar(refreshTokenBruto);
    }

    /** Usado logo após um usuário aceitar um convite, para que ele já fique autenticado. */
    @Transactional
    public AuthTokens emitirParaUsuario(java.util.UUID userId) {
        return emitirPara(users.buscarPorId(userId));
    }

    @Transactional
    public AuthTokens emitirPara(User usuario) {
        String accessToken = jwtService.emitirAccessToken(usuario.getId(), usuario.getEmail());
        String refreshToken = refreshTokens.emitir(usuario.getId());
        return new AuthTokens(accessToken, refreshToken, jwtService.ttlDoAccessTokenEmSegundos());
    }
}
