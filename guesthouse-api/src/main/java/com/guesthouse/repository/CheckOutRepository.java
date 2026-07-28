package com.guesthouse.repository;

import com.guesthouse.entity.CheckOut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CheckOutRepository extends JpaRepository<CheckOut, UUID> {
    Optional<CheckOut> findByBookingId(UUID bookingId);
}
