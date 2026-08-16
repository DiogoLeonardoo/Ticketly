package com.ticketly.user.service;

import com.ticketly.user.controller.dto.AuthResponse;
import com.ticketly.user.controller.dto.LoginRequest;
import com.ticketly.user.controller.dto.RegisterRequest;
import com.ticketly.user.controller.dto.UserResponse;
import com.ticketly.user.domain.Role;
import com.ticketly.user.domain.User;
import com.ticketly.user.exception.AdminRegistrationNotAllowedException;
import com.ticketly.user.exception.EmailAlreadyExistsException;
import com.ticketly.user.exception.InvalidCredentialsException;
import com.ticketly.user.repository.UserRepository;
import com.ticketly.user.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public UserResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new AdminRegistrationNotAllowedException();
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCity(request.city());
        user.setRole(request.role());
        user.setCreatedAt(Instant.now());

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationSeconds(), UserResponse.from(user));
    }
}
