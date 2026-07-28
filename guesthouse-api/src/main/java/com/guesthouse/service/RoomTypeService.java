package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.room.AmenityDto;
import com.guesthouse.dto.room.RoomTypeDto;
import com.guesthouse.entity.Amenity;
import com.guesthouse.entity.RoomType;
import com.guesthouse.repository.AmenityRepository;
import com.guesthouse.repository.RoomRepository;
import com.guesthouse.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final AmenityRepository amenityRepository;
    private final RoomRepository roomRepository;

    public RoomTypeService(RoomTypeRepository roomTypeRepository, AmenityRepository amenityRepository, RoomRepository roomRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.amenityRepository = amenityRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomTypeDto> getRoomTypes(UUID propertyId) {
        return roomTypeRepository.findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAsc(propertyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomTypeDto createRoomType(UUID propertyId, RoomTypeDto dto, UUID userId) {
        if (roomTypeRepository.existsByPropertyIdAndCodeAndDeletedAtIsNull(propertyId, dto.getCode())) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "Room type code already exists: " + dto.getCode());
        }

        RoomType roomType = new RoomType();
        roomType.setPropertyId(propertyId);
        roomType.setCreatedBy(userId);
        copyProperties(dto, roomType);

        if (dto.getAmenityIds() != null && !dto.getAmenityIds().isEmpty()) {
            List<Amenity> amenities = amenityRepository.findAllById(dto.getAmenityIds());
            roomType.setAmenities(new HashSet<>(amenities));
        }

        RoomType saved = roomTypeRepository.save(roomType);
        return mapToDto(saved);
    }

    @Transactional
    public RoomTypeDto updateRoomType(UUID propertyId, UUID id, RoomTypeDto dto, UUID userId) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room type not found"));

        if (!roomType.getCode().equals(dto.getCode()) && roomTypeRepository.existsByPropertyIdAndCodeAndDeletedAtIsNull(propertyId, dto.getCode())) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "Room type code already exists: " + dto.getCode());
        }

        roomType.setUpdatedBy(userId);
        copyProperties(dto, roomType);

        if (dto.getAmenityIds() != null) {
            List<Amenity> amenities = amenityRepository.findAllById(dto.getAmenityIds());
            roomType.setAmenities(new HashSet<>(amenities));
        }

        RoomType saved = roomTypeRepository.save(roomType);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteRoomType(UUID propertyId, UUID id) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room type not found"));

        long roomCount = roomRepository.countByRoomTypeIdAndDeletedAtIsNull(id);
        if (roomCount > 0) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Cannot delete room type referenced by live rooms");
        }

        roomType.setDeletedAt(Instant.now());
        roomTypeRepository.save(roomType);
    }

    private void copyProperties(RoomTypeDto dto, RoomType target) {
        target.setName(dto.getName());
        target.setCode(dto.getCode());
        target.setDescription(dto.getDescription());
        target.setBasePrice(dto.getBasePrice());
        if (dto.getExtraBedPrice() != null) target.setExtraBedPrice(dto.getExtraBedPrice());
        if (dto.getExtraPersonPrice() != null) target.setExtraPersonPrice(dto.getExtraPersonPrice());
        if (dto.getCleaningFee() != null) target.setCleaningFee(dto.getCleaningFee());
        if (dto.getDefaultDeposit() != null) target.setDefaultDeposit(dto.getDefaultDeposit());
        if (dto.getMaxAdults() != null) target.setMaxAdults(dto.getMaxAdults());
        if (dto.getMaxChildren() != null) target.setMaxChildren(dto.getMaxChildren());
        if (dto.getBedCount() != null) target.setBedCount(dto.getBedCount());
        if (dto.getBedType() != null) target.setBedType(dto.getBedType());
        if (dto.getRoomSizeSqm() != null) target.setRoomSizeSqm(dto.getRoomSizeSqm());
        if (dto.getSortOrder() != null) target.setSortOrder(dto.getSortOrder());
        target.setActive(dto.isActive());
    }

    private RoomTypeDto mapToDto(RoomType entity) {
        Set<AmenityDto> amenityDtos = entity.getAmenities().stream()
                .map(a -> new AmenityDto(a.getId(), a.getCategory(), a.getName(), a.getIconName(), a.isGlobal()))
                .collect(Collectors.toSet());

        Set<UUID> amenityIds = entity.getAmenities().stream().map(Amenity::getId).collect(Collectors.toSet());

        return new RoomTypeDto(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getDescription(),
                entity.getBasePrice(),
                entity.getExtraBedPrice(),
                entity.getExtraPersonPrice(),
                entity.getCleaningFee(),
                entity.getDefaultDeposit(),
                entity.getMaxAdults(),
                entity.getMaxChildren(),
                entity.getBedCount(),
                entity.getBedType(),
                entity.getRoomSizeSqm(),
                entity.getSortOrder(),
                entity.isActive(),
                amenityIds,
                amenityDtos
        );
    }
}
