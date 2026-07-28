package com.guesthouse.repository;

import com.guesthouse.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {
    Optional<CheckIn> findByReservationId(UUID reservationId);
}
