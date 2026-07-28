package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.operations.HousekeepingTaskDto;
import com.guesthouse.dto.operations.MaintenanceIssueDto;
import com.guesthouse.dto.operations.ReportIssueRequest;
import com.guesthouse.entity.HousekeepingTask;
import com.guesthouse.entity.MaintenanceIssue;
import com.guesthouse.entity.Room;
import com.guesthouse.repository.HousekeepingTaskRepository;
import com.guesthouse.repository.MaintenanceIssueRepository;
import com.guesthouse.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OperationsService {

    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final MaintenanceIssueRepository maintenanceIssueRepository;
    private final RoomRepository roomRepository;

    public OperationsService(
            HousekeepingTaskRepository housekeepingTaskRepository,
            MaintenanceIssueRepository maintenanceIssueRepository,
            RoomRepository roomRepository
    ) {
        this.housekeepingTaskRepository = housekeepingTaskRepository;
        this.maintenanceIssueRepository = maintenanceIssueRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<HousekeepingTaskDto> getHousekeepingTasks(UUID propertyId) {
        return housekeepingTaskRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId).stream()
                .map(this::mapToTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public HousekeepingTaskDto updateHousekeepingTaskStatus(UUID propertyId, UUID taskId, String newStatus, UUID userId) {
        HousekeepingTask task = housekeepingTaskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Task not found"));

        task.setStatus(newStatus);
        if ("COMPLETED".equalsIgnoreCase(newStatus) || "INSPECTED".equalsIgnoreCase(newStatus)) {
            task.setCompletedAt(Instant.now());
            // Sync room housekeeping status to CLEAN
            Room room = task.getRoom();
            room.setHousekeepingStatus("CLEAN".equalsIgnoreCase(newStatus) ? "CLEAN" : "INSPECTED");
            room.setUpdatedBy(userId);
            roomRepository.save(room);
        }

        HousekeepingTask saved = housekeepingTaskRepository.save(task);
        return mapToTaskDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceIssueDto> getMaintenanceIssues(UUID propertyId) {
        return maintenanceIssueRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId).stream()
                .map(this::mapToIssueDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MaintenanceIssueDto reportMaintenanceIssue(UUID propertyId, ReportIssueRequest request, UUID userId) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room not found"));

        MaintenanceIssue issue = new MaintenanceIssue();
        issue.setPropertyId(propertyId);
        issue.setRoom(room);
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setSeverity(request.getSeverity() != null ? request.getSeverity() : "MEDIUM");
        issue.setStatus("REPORTED");
        issue.setBlocking(request.isBlocking());
        issue.setReportedBy(userId);

        if (request.isBlocking()) {
            room.setOperationalStatus("UNDER_MAINTENANCE");
            room.setUpdatedBy(userId);
            roomRepository.save(room);
        }

        MaintenanceIssue saved = maintenanceIssueRepository.save(issue);
        return mapToIssueDto(saved);
    }

    @Transactional
    public MaintenanceIssueDto resolveMaintenanceIssue(UUID propertyId, UUID issueId, UUID userId) {
        MaintenanceIssue issue = maintenanceIssueRepository.findById(issueId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Maintenance issue not found"));

        issue.setStatus("RESOLVED");
        issue.setResolvedAt(Instant.now());

        if (issue.isBlocking()) {
            Room room = issue.getRoom();
            room.setOperationalStatus("AVAILABLE");
            room.setUpdatedBy(userId);
            roomRepository.save(room);
        }

        MaintenanceIssue saved = maintenanceIssueRepository.save(issue);
        return mapToIssueDto(saved);
    }

    private HousekeepingTaskDto mapToTaskDto(HousekeepingTask t) {
        return new HousekeepingTaskDto(t.getId(), t.getRoom().getId(), t.getRoom().getRoomNumber(), t.getTaskType(), t.getPriority(), t.getStatus(), t.getNotes(), t.getScheduledDate(), t.getCompletedAt());
    }

    private MaintenanceIssueDto mapToIssueDto(MaintenanceIssue m) {
        return new MaintenanceIssueDto(m.getId(), m.getRoom().getId(), m.getRoom().getRoomNumber(), m.getTitle(), m.getDescription(), m.getSeverity(), m.getStatus(), m.isBlocking(), m.getResolvedAt());
    }
}
