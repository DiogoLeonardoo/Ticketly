package com.ticketly.user.controller.dto;

import com.ticketly.user.domain.Role;
import com.ticketly.user.domain.User;

import java.util.UUID;

public record UserResponse(UUID id, String email, String city, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getCity(), user.getRole());
    }
}
