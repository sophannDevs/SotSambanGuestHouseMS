package com.guesthouse.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.dto.auth.LoginRequest;
import com.guesthouse.dto.auth.LoginResponse;
import com.guesthouse.dto.auth.RefreshTokenRequest;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtAuthenticationFilter;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void loginWithValidCredentialsShouldReturnToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("owner@sotsamban.local");
        request.setPassword("password123");

        LoginResponse response = new LoginResponse(
                "mock-access-token",
                "mock-refresh-token",
                "Bearer",
                UUID.randomUUID(),
                UUID.randomUUID(),
                "owner@sotsamban.local",
                "Owner Admin",
                Set.of("OWNER"),
                Set.of("dashboard:view", "booking:view")
        );

        given(authService.login(any(LoginRequest.class), any())).willReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("mock-refresh-token"))
                .andExpect(jsonPath("$.data.email").value("owner@sotsamban.local"));
    }

    @Test
    void refreshWithValidTokenShouldReturnNewToken() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("mock-refresh-token");

        LoginResponse response = new LoginResponse(
                "new-access-token",
                "new-refresh-token",
                "Bearer",
                UUID.randomUUID(),
                UUID.randomUUID(),
                "owner@sotsamban.local",
                "Owner Admin",
                Set.of("OWNER"),
                Set.of("dashboard:view")
        );

        given(authService.refreshToken(any(RefreshTokenRequest.class))).willReturn(response);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"));
    }
}
