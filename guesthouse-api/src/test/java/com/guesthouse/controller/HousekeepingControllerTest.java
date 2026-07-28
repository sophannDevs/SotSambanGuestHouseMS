package com.guesthouse.controller;

import com.guesthouse.dto.operations.HousekeepingTaskDto;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtAuthenticationFilter;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.security.UserPrincipal;
import com.guesthouse.service.OperationsService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HousekeepingController.class)
@AutoConfigureMockMvc(addFilters = false)
class HousekeepingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OperationsService operationsService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getTasksShouldReturnList() throws Exception {
        UUID propertyId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(),
                propertyId,
                "housekeeping@sotsamban.local",
                "hashed",
                "Cleaner Staff",
                "ACTIVE",
                List.of(new SimpleGrantedAuthority("housekeeping:view"))
        );

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        HousekeepingTaskDto task = new HousekeepingTaskDto(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "102",
                "CHECKOUT_CLEANING",
                "HIGH",
                "PENDING",
                "Clean double bed room",
                LocalDate.now(),
                null
        );

        given(operationsService.getHousekeepingTasks(any())).willReturn(List.of(task));

        mockMvc.perform(get("/api/v1/housekeeping/tasks")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].roomNumber").value("102"))
                .andExpect(jsonPath("$.data[0].taskType").value("CHECKOUT_CLEANING"));
    }
}
