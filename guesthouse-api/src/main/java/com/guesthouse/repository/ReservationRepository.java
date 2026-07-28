package com.guesthouse.repository;

import com.guesthouse.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId);
    Optional<Reservation> findByPropertyIdAndReservationNumber(UUID propertyId, String reservationNumber);
    List<Reservation> findByPropertyIdAndArrivalDateLessThanEqualAndDepartureDateGreaterThanEqual(UUID propertyId, LocalDate departure, LocalDate arrival);
}
