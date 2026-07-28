package com.guesthouse.repository;

import com.guesthouse.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {
    List<Receipt> findByPropertyIdOrderByIssuedAtDesc(UUID propertyId);
}
