package com.guesthouse.repository;

import com.guesthouse.entity.ReservationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationStatusHistoryRepository extends JpaRepository<ReservationStatusHistory, UUID> {
    List<ReservationStatusHistory> findByReservationIdOrderByCreatedAtDesc(UUID reservationId);
}
