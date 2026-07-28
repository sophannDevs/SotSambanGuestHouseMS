package com.guesthouse.repository;

import com.guesthouse.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAscRoomNumberAsc(UUID propertyId);
    List<Room> findByPropertyIdAndFloorAndDeletedAtIsNullOrderByRoomNumberAsc(UUID propertyId, Integer floor);
    Optional<Room> findByPropertyIdAndRoomNumberAndDeletedAtIsNull(UUID propertyId, String roomNumber);
    boolean existsByPropertyIdAndRoomNumberAndDeletedAtIsNull(UUID propertyId, String roomNumber);
    long countByRoomTypeIdAndDeletedAtIsNull(UUID roomTypeId);
}
