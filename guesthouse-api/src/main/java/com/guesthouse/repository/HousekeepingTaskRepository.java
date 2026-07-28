package com.guesthouse.repository;

import com.guesthouse.entity.HousekeepingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface HousekeepingTaskRepository extends JpaRepository<HousekeepingTask, UUID> {
    List<HousekeepingTask> findByPropertyIdAndScheduledDateOrderByPriorityDesc(UUID propertyId, LocalDate scheduledDate);
    List<HousekeepingTask> findByPropertyIdOrderByCreatedAtDesc(UUID propertyId);
}
