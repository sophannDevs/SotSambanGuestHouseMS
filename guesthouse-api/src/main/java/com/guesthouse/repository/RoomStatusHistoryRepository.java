package com.guesthouse.repository;

import com.guesthouse.entity.RoomStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomStatusHistoryRepository extends JpaRepository<RoomStatusHistory, UUID> {
    List<RoomStatusHistory> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
}
