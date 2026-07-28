package com.guesthouse.repository;

import com.guesthouse.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId);
    Optional<Booking> findByPropertyIdAndBookingNumber(UUID propertyId, String bookingNumber);
    List<Booking> findByPropertyIdAndArrivalDateLessThanEqualAndDepartureDateGreaterThanEqual(UUID propertyId, LocalDate departure, LocalDate arrival);
}
