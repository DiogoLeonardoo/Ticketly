package com.ticketly.user.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    EMAIL_ALREADY_EXISTS("error.email-already-exists", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("error.invalid-credentials", HttpStatus.UNAUTHORIZED),
    ADMIN_REGISTRATION_NOT_ALLOWED("error.admin-registration-not-allowed", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR("error.validation", HttpStatus.BAD_REQUEST);

    private final String messageKey;
    private final HttpStatus status;

    ErrorCode(String messageKey, HttpStatus status) {
        this.messageKey = messageKey;
        this.status = status;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
