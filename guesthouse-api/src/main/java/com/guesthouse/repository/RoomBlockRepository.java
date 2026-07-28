package com.guesthouse.repository;

import com.guesthouse.entity.RoomBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoomBlockRepository extends JpaRepository<RoomBlock, UUID> {
    List<RoomBlock> findByPropertyId(UUID propertyId);
    List<RoomBlock> findByRoomIdAndEndDateGreaterThanEqualAndStartDateLessThanEqual(UUID roomId, LocalDate start, LocalDate end);
}
