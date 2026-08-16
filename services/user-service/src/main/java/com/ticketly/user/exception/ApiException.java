package com.ticketly.user.exception;

public abstract class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Object[] args;

    protected ApiException(ErrorCode errorCode, Object... args) {
        this.errorCode = errorCode;
        this.args = args;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Object[] getArgs() {
        return args;
    }
}
