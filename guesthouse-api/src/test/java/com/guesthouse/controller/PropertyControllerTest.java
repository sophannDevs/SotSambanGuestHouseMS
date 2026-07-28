package com.guesthouse.controller;

import com.guesthouse.dto.property.PropertyResponse;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtAuthenticationFilter;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.PropertyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PropertyController.class)
@AutoConfigureMockMvc(addFilters = false)
class PropertyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PropertyService propertyService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getCurrentPropertyShouldReturnDetails() throws Exception {
        UUID propertyId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(),
                propertyId,
                "owner@sotsamban.local",
                "hashed",
                "Owner Admin",
                "ACTIVE",
                List.of(new SimpleGrantedAuthority("property:view"))
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        PropertyResponse response = new PropertyResponse(
                propertyId,
                "Sot Samban Guest House",
                "SSGH",
                "Local family guest house",
                "Asia/Phnom_Penh",
                "USD",
                "Street 05, Wat Bo",
                "Siem Reap",
                "Siem Reap",
                "Cambodia",
                "17252",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                LocalTime.of(14, 0),
                LocalTime.of(12, 0),
                "TAX12345",
                "REG67890",
                null, null,
                "Sot Samban Co., Ltd.",
                "Street 05, Wat Bo",
                "ABA Bank: 000 123 456",
                "Thank you for staying with us",
                "Standard house terms",
                "24h cancellation notice required",
                "No smoking indoors",
                "SotSamban_Guest_WiFi",
                "Welcome2026",
                "+85512345678",
                true,
                14
        );

        given(propertyService.getProperty(any())).willReturn(response);

        mockMvc.perform(get("/api/v1/properties/current")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Sot Samban Guest House"))
                .andExpect(jsonPath("$.data.code").value("SSGH"));
    }
}
