package com.guesthouse.repository;

import com.guesthouse.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByPropertyIdOrderByExpenseDateDesc(UUID propertyId);
    List<Expense> findByPropertyIdAndApprovalStatus(UUID propertyId, String approvalStatus);
}
