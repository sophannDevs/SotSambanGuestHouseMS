package com.guesthouse.controller;

import com.guesthouse.dto.guest.GuestDto;
import com.guesthouse.dto.reservation.ReservationDto;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtAuthenticationFilter;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.ReservationService;
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
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReservationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReservationService reservationService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getReservationsShouldReturnList() throws Exception {
        UUID propertyId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(),
                propertyId,
                "receptionist@sotsamban.local",
                "hashed",
                "Reception Staff",
                "ACTIVE",
                List.of(new SimpleGrantedAuthority("reservation:view"))
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        GuestDto guest = new GuestDto(UUID.randomUUID(), "John", "Smith", "john@example.com", "+123", "ID9988", "American", "VIP_GOLD", null);

        ReservationDto rsv = new ReservationDto(
                UUID.randomUUID(),
                "RSV-2026-000001",
                guest,
                UUID.randomUUID(),
                "Standard Double",
                UUID.randomUUID(),
                "102",
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                2, 2, 0,
                new BigDecimal("30.00"),
                BigDecimal.ZERO,
                new BigDecimal("6.00"),
                new BigDecimal("66.00"),
                new BigDecimal("66.00"),
                BigDecimal.ZERO,
                "CHECKED_IN",
                "PAID",
                "DIRECT_WALK_IN",
                null, null, null, 0L
        );

        given(reservationService.getReservations(any())).willReturn(List.of(rsv));

        mockMvc.perform(get("/api/v1/reservations")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].reservationNumber").value("RSV-2026-000001"))
                .andExpect(jsonPath("$.data[0].reservationStatus").value("CHECKED_IN"));
    }
}
