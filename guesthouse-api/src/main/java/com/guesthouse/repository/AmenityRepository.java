package com.guesthouse.repository;

import com.guesthouse.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, UUID> {
    List<Amenity> findByPropertyIdOrIsGlobalTrue(UUID propertyId);
}
