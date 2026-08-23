package com.cbrsx.backend.controller;

import com.cbrsx.backend.dto.ValidationErrorDTO;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler that:
 * - Never exposes stack traces or internal details to the client
 * - Logs full details server-side for debugging
 * - Returns generic, safe error messages
 * - Sanitizes user-influenced content from error responses
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ValidationErrorDTO> handleIllegalArgument(IllegalArgumentException ex) {
        // Log full details server-side only
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new ValidationErrorDTO("Bad Request", "The request contains invalid parameters")
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fieldErrors.put(fe.getField(), sanitizeMessage(fe.getDefaultMessage())));

        log.warn("Validation failed with {} field errors", fieldErrors.size());
        return ResponseEntity.badRequest().body(Map.of(
                "error", "Validation Failed",
                "fields", fieldErrors,
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationErrorDTO> handleConstraintViolation(ConstraintViolationException ex) {
        log.warn("Constraint violation: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new ValidationErrorDTO("Validation Failed", "Request violates input constraints")
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ValidationErrorDTO> handleUnreadable(HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new ValidationErrorDTO("Malformed Request", "Request body is not valid JSON")
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ValidationErrorDTO> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ValidationErrorDTO("Conflict", "Resource already exists or violates a data constraint"));
    }

    /**
     * Catch-all handler for unexpected exceptions.
     * Logs full stack trace server-side, returns only a generic message to the client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ValidationErrorDTO> handleGeneric(Exception ex) {
        // Log the full exception with stack trace for server-side debugging
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        // Never expose internal details to the client
        return ResponseEntity.internalServerError()
                .body(new ValidationErrorDTO("Internal Server Error", "An unexpected error occurred. Please try again later."));
    }

    /**
     * Sanitize error messages to remove potentially sensitive information
     * like database names, table names, column names, or stack trace fragments.
     */
    private String sanitizeMessage(String message) {
        if (message == null) return "Invalid input";
        // Remove common internal details that could leak info
        return message
                .replaceAll("(?i)org\\.\\w+\\.", "")      // Remove package names
                .replaceAll("(?i)exception\\s*:.+", "")   // Remove exception chains
                .replaceAll("(?i)at\\s+\\w+\\.", "")      // Remove stack traces
                .replaceAll("(?i)table\\s+\"?\\w+\"?", "table")  // Replace actual table names
                .replaceAll("(?i)column\\s+\"?\\w+\"?", "column") // Replace actual column names
                .replaceAll("(?i)constraint\\s+\"?\\w+\"?", "constraint")
                .trim();
    }
}
