package com.guesthouse.repository;

import com.guesthouse.entity.ReservationRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRoomRepository extends JpaRepository<ReservationRoom, UUID> {
    List<ReservationRoom> findByReservationId(UUID reservationId);
}
