package com.taskmanager.shared.error;

import java.net.URI;
import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Base type for expected, client-facing errors. Each instance carries everything
 * the {@link GlobalExceptionHandler} needs to build an RFC 7807 response.
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
