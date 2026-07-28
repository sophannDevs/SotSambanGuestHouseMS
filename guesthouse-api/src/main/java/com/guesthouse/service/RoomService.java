package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.room.BulkCreateRoomsRequest;
import com.guesthouse.dto.room.RoomBlockDto;
import com.guesthouse.dto.room.RoomDto;
import com.guesthouse.entity.Room;
import com.guesthouse.entity.RoomBlock;
import com.guesthouse.entity.RoomStatusHistory;
import com.guesthouse.entity.RoomType;
import com.guesthouse.repository.RoomBlockRepository;
import com.guesthouse.repository.RoomRepository;
import com.guesthouse.repository.RoomStatusHistoryRepository;
import com.guesthouse.repository.RoomTypeRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final RoomStatusHistoryRepository roomStatusHistoryRepository;

    public RoomService(
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository,
            RoomBlockRepository roomBlockRepository,
            RoomStatusHistoryRepository roomStatusHistoryRepository
    ) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.roomBlockRepository = roomBlockRepository;
        this.roomStatusHistoryRepository = roomStatusHistoryRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "roomAvailability", key = "#propertyId + '-' + #floor")
    public List<RoomDto> getRooms(UUID propertyId, Integer floor) {
        List<Room> rooms = (floor != null)
                ? roomRepository.findByPropertyIdAndFloorAndDeletedAtIsNullOrderByRoomNumberAsc(propertyId, floor)
                : roomRepository.findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAscRoomNumberAsc(propertyId);

        return rooms.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "roomAvailability", allEntries = true)
    public RoomDto createRoom(UUID propertyId, RoomDto dto, UUID userId) {
        if (roomRepository.existsByPropertyIdAndRoomNumberAndDeletedAtIsNull(propertyId, dto.getRoomNumber())) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "Room number already exists: " + dto.getRoomNumber());
        }

        RoomType roomType = roomTypeRepository.findById(dto.getRoomTypeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room type not found"));

        Room room = new Room();
        room.setPropertyId(propertyId);
        room.setRoomType(roomType);
        room.setRoomNumber(dto.getRoomNumber());
        room.setRoomName(dto.getRoomName() != null ? dto.getRoomName() : "Room " + dto.getRoomNumber());
        room.setFloor(dto.getFloor() != null ? dto.getFloor() : 1);
        room.setBuilding(dto.getBuilding() != null ? dto.getBuilding() : "Main");
        room.setMaxOccupancy(dto.getMaxOccupancy() != null ? dto.getMaxOccupancy() : roomType.getMaxAdults());
        room.setNotes(dto.getNotes());
        room.setCreatedBy(userId);

        Room saved = roomRepository.save(room);
        return mapToDto(saved);
    }

    @Transactional
    @CacheEvict(value = "roomAvailability", allEntries = true)
    public List<RoomDto> bulkCreateRooms(UUID propertyId, BulkCreateRoomsRequest request, UUID userId) {
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room type not found"));

        List<Room> createdRooms = new ArrayList<>();

        for (int i = request.getStartNumber(); i <= request.getEndNumber(); i++) {
            String roomNum = request.getPrefix() + i;
            if (roomRepository.existsByPropertyIdAndRoomNumberAndDeletedAtIsNull(propertyId, roomNum)) {
                continue; // Skip existing numbers in bulk run
            }

            Room room = new Room();
            room.setPropertyId(propertyId);
            room.setRoomType(roomType);
            room.setRoomNumber(roomNum);
            room.setRoomName("Room " + roomNum);
            room.setFloor(request.getFloor());
            room.setBuilding(request.getBuilding());
            room.setMaxOccupancy(roomType.getMaxAdults());
            room.setCreatedBy(userId);

            createdRooms.add(room);
        }

        List<Room> saved = roomRepository.saveAll(createdRooms);
        return saved.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "roomAvailability", allEntries = true)
    public RoomDto updateHousekeepingStatus(UUID propertyId, UUID roomId, String housekeepingStatus, UUID userId, String reason) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room not found"));

        String oldHk = room.getHousekeepingStatus();
        room.setHousekeepingStatus(housekeepingStatus);
        room.setUpdatedBy(userId);

        Room saved = roomRepository.save(room);

        // Record history log
        RoomStatusHistory history = new RoomStatusHistory();
        history.setRoomId(roomId);
        history.setPreviousOperationalStatus(room.getOperationalStatus());
        history.setNewOperationalStatus(room.getOperationalStatus());
        history.setPreviousHousekeepingStatus(oldHk);
        history.setNewHousekeepingStatus(housekeepingStatus);
        history.setChangedBy(userId);
        history.setReason(reason != null ? reason : "Housekeeping status update");
        roomStatusHistoryRepository.save(history);

        return mapToDto(saved);
    }

    @Transactional
    @CacheEvict(value = "roomAvailability", allEntries = true)
    public RoomBlockDto blockRoom(UUID propertyId, RoomBlockDto dto, UUID userId) {
        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room not found"));

        RoomBlock block = new RoomBlock();
        block.setPropertyId(propertyId);
        block.setRoom(room);
        block.setStartDate(dto.getStartDate());
        block.setEndDate(dto.getEndDate());
        block.setReason(dto.getReason());
        block.setNote(dto.getNote());
        block.setCreatedBy(userId);

        RoomBlock savedBlock = roomBlockRepository.save(block);

        // Update operational status
        room.setOperationalStatus("BLOCKED");
        roomRepository.save(room);

        return new RoomBlockDto(savedBlock.getId(), room.getId(), room.getRoomNumber(), savedBlock.getStartDate(), savedBlock.getEndDate(), savedBlock.getReason(), savedBlock.getNote());
    }

    /**
     * FrontDeskService and OperationsService mutate Room's operational/
     * housekeeping status directly (check-in/out, maintenance, inspections)
     * without going through this service, so they call this to invalidate
     * the cache populated by getRooms().
     */
    @CacheEvict(value = "roomAvailability", allEntries = true)
    public void evictRoomAvailabilityCache() {
    }

    private RoomDto mapToDto(Room room) {
        String derivedStatus = computeDerivedDisplayStatus(room.getOperationalStatus(), room.getHousekeepingStatus());

        return new RoomDto(
                room.getId(),
                room.getRoomType().getId(),
                room.getRoomType().getName(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getFloor(),
                room.getBuilding(),
                room.getMaxOccupancy(),
                room.getOperationalStatus(),
                room.getHousekeepingStatus(),
                derivedStatus,
                room.getNotes(),
                room.getSortOrder(),
                room.isActive()
        );
    }

    /**
     * Computederived display status per business-rules.md Section 9.6 / FR-075:
     * Combines operational_status & housekeeping_status into single derived display tag.
     */
    private String computeDerivedDisplayStatus(String opStatus, String hkStatus) {
        if ("BLOCKED".equalsIgnoreCase(opStatus)) return "BLOCKED";
        if ("UNDER_MAINTENANCE".equalsIgnoreCase(opStatus)) return "UNDER_MAINTENANCE";
        if ("OUT_OF_SERVICE".equalsIgnoreCase(opStatus)) return "OUT_OF_SERVICE";
        if ("OCCUPIED".equalsIgnoreCase(opStatus)) {
            return "DIRTY".equalsIgnoreCase(hkStatus) ? "OCCUPIED_DIRTY" : "OCCUPIED";
        }
        if ("RESERVED".equalsIgnoreCase(opStatus)) return "RESERVED";
        return hkStatus != null ? hkStatus.toUpperCase() : "CLEAN";
    }
}
