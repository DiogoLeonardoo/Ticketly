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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void register_deveCriarUsuarioComSenhaHasheada() {
        RegisterRequest request = new RegisterRequest("Diogo", "diogo@ticketly.com", "senha1234", "Fortaleza", Role.ORGANIZER);
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hash-fake");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        UserResponse response = authService.register(request);

        assertThat(response.name()).isEqualTo("Diogo");
        assertThat(response.email()).isEqualTo("diogo@ticketly.com");
        assertThat(response.city()).isEqualTo("Fortaleza");
        assertThat(response.role()).isEqualTo(Role.ORGANIZER);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertThat(savedUser.getValue().getPasswordHash()).isEqualTo("hash-fake");
    }

    @Test
    void register_deveRejeitarCadastroComRoleAdmin() {
        RegisterRequest request = new RegisterRequest("Hacker", "hacker@ticketly.com", "senha1234", "Fortaleza", Role.ADMIN);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(AdminRegistrationNotAllowedException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_deveRejeitarEmailJaCadastrado() {
        RegisterRequest request = new RegisterRequest("Diogo", "diogo@ticketly.com", "senha1234", "Fortaleza", Role.USER);
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_deveRetornarTokenParaCredenciaisValidas() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName("Diogo");
        user.setEmail("diogo@ticketly.com");
        user.setPasswordHash("hash-fake");
        user.setCity("Fortaleza");
        user.setRole(Role.ORGANIZER);

        LoginRequest request = new LoginRequest("diogo@ticketly.com", "senha1234");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("token-fake");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("token-fake");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresInSeconds()).isEqualTo(3600L);
        assertThat(response.user().email()).isEqualTo("diogo@ticketly.com");
    }

    @Test
    void login_deveRejeitarEmailInexistente() {
        LoginRequest request = new LoginRequest("naoexiste@ticketly.com", "senha1234");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_deveRejeitarSenhaIncorreta() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("diogo@ticketly.com");
        user.setPasswordHash("hash-fake");
        user.setRole(Role.USER);

        LoginRequest request = new LoginRequest("diogo@ticketly.com", "senha-errada");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
