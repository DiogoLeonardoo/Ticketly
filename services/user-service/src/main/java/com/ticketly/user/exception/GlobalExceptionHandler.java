package com.ticketly.user.exception;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException ex) {
        String message = messageSource.getMessage(
                ex.getErrorCode().getMessageKey(), ex.getArgs(), LocaleContextHolder.getLocale());
        return ResponseEntity.status(ex.getErrorCode().getStatus())
                .body(new ApiError(ex.getErrorCode().name(), message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        String fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        String message = messageSource.getMessage(
                ErrorCode.VALIDATION_ERROR.getMessageKey(), new Object[]{fieldErrors}, LocaleContextHolder.getLocale());
        return ResponseEntity.status(ErrorCode.VALIDATION_ERROR.getStatus())
                .body(new ApiError(ErrorCode.VALIDATION_ERROR.name(), message));
    }
}
