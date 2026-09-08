package com.taskmanager.shared.error;

import java.net.URI;
import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Tipo base para erros esperados e voltados ao cliente. Cada instância carrega
 * tudo o que o {@link GlobalExceptionHandler} precisa para montar uma resposta
 * no formato RFC 7807.
 */
public class ApiException extends RuntimeException {

    private static final String TYPE_PREFIX = "https://taskmanager/errors/";

    private final HttpStatus status;
    private final String title;
    private final URI type;
    private final transient Map<String, Object> properties;

    public ApiException(HttpStatus status, String typeSlug, String title, String detail,
            Map<String, Object> properties) {
        super(detail);
        this.status = status;
        this.title = title;
        this.type = URI.create(TYPE_PREFIX + typeSlug);
        this.properties = properties == null ? Map.of() : Map.copyOf(properties);
    }

    public ApiException(HttpStatus status, String typeSlug, String title, String detail) {
        this(status, typeSlug, title, detail, Map.of());
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getTitle() {
        return title;
    }

    public URI getType() {
        return type;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }
}
