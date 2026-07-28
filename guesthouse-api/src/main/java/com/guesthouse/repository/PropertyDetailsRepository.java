package com.guesthouse.repository;

import com.guesthouse.entity.PropertyDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyDetailsRepository extends JpaRepository<PropertyDetails, UUID> {
    Optional<PropertyDetails> findByPropertyId(UUID propertyId);
}
