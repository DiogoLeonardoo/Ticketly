package com.ticketly.user.security;

import com.ticketly.user.domain.Role;
import com.ticketly.user.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-only-jwt-secret-com-pelo-menos-32-bytes-1234567890";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 60);
    }

    @Test
    void generateToken_deveCriarTokenComClaimsCorretas() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("diogo@ticketly.com");
        user.setRole(Role.ORGANIZER);

        String token = jwtService.generateToken(user);
        Claims claims = jwtService.parseClaims(token);

        assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
        assertThat(claims.get("email", String.class)).isEqualTo("diogo@ticketly.com");
        assertThat(claims.get("role", String.class)).isEqualTo("ORGANIZER");
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @Test
    void parseClaims_deveRejeitarTokenInvalido() {
        assertThatThrownBy(() -> jwtService.parseClaims("token.invalido.aqui"))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void parseClaims_deveRejeitarTokenAssinadoComOutraChave() {
        JwtService outroServico = new JwtService("outra-chave-secreta-com-pelo-menos-32-bytes-000000", 60);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("diogo@ticketly.com");
        user.setRole(Role.USER);

        String token = outroServico.generateToken(user);

        assertThatThrownBy(() -> jwtService.parseClaims(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void getExpirationSeconds_deveConverterMinutosParaSegundos() {
        assertThat(jwtService.getExpirationSeconds()).isEqualTo(3600L);
    }
}
