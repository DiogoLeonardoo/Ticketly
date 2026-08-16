package com.ticketly.user.controller.dto;

public record AuthResponse(String token, String tokenType, long expiresInSeconds, UserResponse user) {
}
