package com.guesthouse.controller;

import com.guesthouse.dto.room.RoomDto;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtAuthenticationFilter;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.RoomService;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RoomController.class)
@AutoConfigureMockMvc(addFilters = false)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getRoomsShouldReturnRoomList() throws Exception {
        UUID propertyId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(),
                propertyId,
                "receptionist@sotsamban.local",
                "hashed",
                "Reception Staff",
                "ACTIVE",
                List.of(new SimpleGrantedAuthority("room:view"))
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        RoomDto room101 = new RoomDto(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Standard Single",
                "101",
                "Room 101",
                1,
                "Main",
                1,
                "AVAILABLE",
                "CLEAN",
                "CLEAN",
                "Near entrance",
                1,
                true
        );

        given(roomService.getRooms(any(), any())).willReturn(List.of(room101));

        mockMvc.perform(get("/api/v1/rooms")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].roomNumber").value("101"))
                .andExpect(jsonPath("$.data[0].derivedStatus").value("CLEAN"));
    }
}
