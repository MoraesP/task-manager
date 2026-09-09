package com.taskmanager.shared.error;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import jakarta.validation.ConstraintViolationException;

/**
 * Traduz toda exceção que chega ao dispatcher para um corpo
 * {@code application/problem+json} (RFC 7807).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ProblemDetail tratarApiException(ApiException excecao) {
        if (excecao.getStatus().is5xxServerError()) {
            log.error("Erro de API", excecao);
        } else {
            log.warn("Erro de API: {} - {}", excecao.getStatus(), excecao.getMessage());
        }
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(excecao.getStatus(), excecao.getMessage());
        problema.setTitle(excecao.getTitle());
        problema.setType(excecao.getType());
        excecao.getProperties().forEach(problema::setProperty);
        return problema;
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail tratarAutenticacao(AuthenticationException excecao) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED,
                "Autenticação é obrigatória ou falhou.");
        problema.setTitle("Não autenticado");
        return problema;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail tratarAcessoNegado(AccessDeniedException excecao) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN,
                "Você não tem permissão para executar esta ação.");
        problema.setTitle("Acesso negado");
        return problema;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail tratarViolacaoDeRestricao(ConstraintViolationException excecao) {
        List<Map<String, String>> erros = excecao.getConstraintViolations().stream()
                .map(violacao -> Map.of("field", violacao.getPropertyPath().toString(), "message", violacao.getMessage()))
                .toList();
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Parâmetros da requisição inválidos.");
        problema.setTitle("Falha de validação");
        problema.setProperty("errors", erros);
        return problema;
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException excecao,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<Map<String, String>> erros = excecao.getBindingResult().getFieldErrors().stream()
                .map(erroDeCampo -> Map.of("field", erroDeCampo.getField(),
                        "message", erroDeCampo.getDefaultMessage() == null ? "inválido" : erroDeCampo.getDefaultMessage()))
                .toList();
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Corpo da requisição inválido.");
        problema.setTitle("Falha de validação");
        problema.setProperty("errors", erros);
        return ResponseEntity.badRequest().body(problema);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail tratarInesperado(Exception ex) {
        log.error("Erro inesperado", ex);
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro inesperado.");
        problema.setTitle("Erro interno do servidor");
        return problema;
    }
}
