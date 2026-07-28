package com.guesthouse.repository;

import com.guesthouse.entity.Tax;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaxRepository extends JpaRepository<Tax, UUID> {
    List<Tax> findByPropertyId(UUID propertyId);
    List<Tax> findByPropertyIdAndIsActiveTrue(UUID propertyId);
}
