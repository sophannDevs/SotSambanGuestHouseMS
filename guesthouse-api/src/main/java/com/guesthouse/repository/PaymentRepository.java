package com.guesthouse.repository;

import com.guesthouse.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByPropertyIdOrderByPaymentTimeDesc(UUID propertyId);
    List<Payment> findByReservationId(UUID reservationId);
}
