package com.ticketly.user.exception;

public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException() {
        super(ErrorCode.INVALID_CREDENTIALS);
    }
}
