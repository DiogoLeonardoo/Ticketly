package com.ticketly.user.exception;

public class AdminRegistrationNotAllowedException extends ApiException {

    public AdminRegistrationNotAllowedException() {
        super(ErrorCode.ADMIN_REGISTRATION_NOT_ALLOWED);
    }
}
