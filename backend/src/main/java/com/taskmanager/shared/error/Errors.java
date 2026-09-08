package com.taskmanager.shared.error;

import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Factory methods for the {@link ApiException}s raised across features. Keeping
 * them here gives every error a consistent type slug and title.
 */
public final class Errors {

    private Errors() {
    }

    public static ApiException notFound(String resource, Object id) {
        return new ApiException(HttpStatus.NOT_FOUND, "not-found",
                resource + " not found",
                "%s with id %s was not found.".formatted(resource, id));
    }

    public static ApiException forbidden(String detail) {
        return new ApiException(HttpStatus.FORBIDDEN, "forbidden", "Access denied", detail);
    }

    public static ApiException unauthorized(String detail) {
        return new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized", "Authentication failed", detail);
    }

    public static ApiException conflict(String typeSlug, String title, String detail) {
        return new ApiException(HttpStatus.CONFLICT, typeSlug, title, detail);
    }

    public static ApiException conflict(String typeSlug, String title, String detail, Map<String, Object> properties) {
        return new ApiException(HttpStatus.CONFLICT, typeSlug, title, detail, properties);
    }

    public static ApiException unprocessable(String typeSlug, String title, String detail) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, typeSlug, title, detail);
    }

    public static ApiException unprocessable(String typeSlug, String title, String detail, Map<String, Object> properties) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, typeSlug, title, detail, properties);
    }
}
