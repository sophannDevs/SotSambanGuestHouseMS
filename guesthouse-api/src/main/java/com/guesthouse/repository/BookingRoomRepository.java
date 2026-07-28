package com.guesthouse.repository;

import com.guesthouse.entity.BookingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRoomRepository extends JpaRepository<BookingRoom, UUID> {
    List<BookingRoom> findByBookingId(UUID bookingId);
}
