package com.guesthouse.repository;

import com.guesthouse.entity.RatePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RatePlanRepository extends JpaRepository<RatePlan, UUID> {
    List<RatePlan> findByPropertyId(UUID propertyId);
}
