package com.guesthouse.repository;

import com.guesthouse.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, UUID> {
    List<RoomType> findByPropertyIdAndDeletedAtIsNullOrderBySortOrderAsc(UUID propertyId);
    Optional<RoomType> findByPropertyIdAndCodeAndDeletedAtIsNull(UUID propertyId, String code);
    boolean existsByPropertyIdAndCodeAndDeletedAtIsNull(UUID propertyId, String code);
}
