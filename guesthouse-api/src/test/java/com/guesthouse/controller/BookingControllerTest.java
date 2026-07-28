package com.guesthouse.controller;

import com.guesthouse.dto.booking.BookingDto;
import com.guesthouse.dto.guest.GuestDto;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtAuthenticationFilter;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.BookingService;
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

@WebMvcTest(BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getBookingsShouldReturnList() throws Exception {
        UUID propertyId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(),
                propertyId,
                "receptionist@sotsamban.local",
                "hashed",
                "Reception Staff",
                "ACTIVE",
                List.of(new SimpleGrantedAuthority("booking:view"))
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        GuestDto guest = new GuestDto(UUID.randomUUID(), "John", "Smith", "john@example.com", "+123", "ID9988", "American", "VIP_GOLD", null);

        BookingDto bkg = new BookingDto(
                UUID.randomUUID(),
                "BKG-2026-000001",
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

        given(bookingService.getBookings(any())).willReturn(List.of(bkg));

        mockMvc.perform(get("/api/v1/bookings")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].bookingNumber").value("BKG-2026-000001"))
                .andExpect(jsonPath("$.data[0].bookingStatus").value("CHECKED_IN"));
    }
}
