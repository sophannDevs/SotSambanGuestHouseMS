package com.guesthouse.repository;

import com.guesthouse.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, UUID> {
    Page<LoginHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<LoginHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
