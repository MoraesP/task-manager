package com.taskmanager.shared.error;

import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Métodos de fábrica para as {@link ApiException}s lançadas pelas features.
 * Centralizá-los aqui garante um slug de tipo e um título consistentes para
 * cada erro.
 */
public final class Errors {

    private Errors() {
    }

    public static ApiException notFound(String recurso, Object id) {
        return new ApiException(HttpStatus.NOT_FOUND, "not-found",
                recurso + " não encontrado(a)",
                "%s com id %s não foi encontrado(a).".formatted(recurso, id));
    }

    public static ApiException forbidden(String detalhe) {
        return new ApiException(HttpStatus.FORBIDDEN, "forbidden", "Acesso negado", detalhe);
    }

    public static ApiException unauthorized(String detalhe) {
        return new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized", "Falha de autenticação", detalhe);
    }

    public static ApiException conflict(String slugTipo, String titulo, String detalhe) {
        return new ApiException(HttpStatus.CONFLICT, slugTipo, titulo, detalhe);
    }

    public static ApiException conflict(String slugTipo, String titulo, String detalhe,
            Map<String, Object> propriedades) {
        return new ApiException(HttpStatus.CONFLICT, slugTipo, titulo, detalhe, propriedades);
    }

    public static ApiException unprocessable(String slugTipo, String titulo, String detalhe) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, slugTipo, titulo, detalhe);
    }

    public static ApiException unprocessable(String slugTipo, String titulo, String detalhe,
            Map<String, Object> propriedades) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, slugTipo, titulo, detalhe, propriedades);
    }
}
