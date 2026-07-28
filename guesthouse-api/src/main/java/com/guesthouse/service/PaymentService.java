package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.payment.InvoiceDto;
import com.guesthouse.dto.payment.PaymentDto;
import com.guesthouse.dto.payment.RecordPaymentRequest;
import com.guesthouse.entity.*;
import com.guesthouse.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final ReservationRepository reservationRepository;
    private final DocumentSequenceRepository documentSequenceRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            ReceiptRepository receiptRepository,
            ReservationRepository reservationRepository,
            DocumentSequenceRepository documentSequenceRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.receiptRepository = receiptRepository;
        this.reservationRepository = reservationRepository;
        this.documentSequenceRepository = documentSequenceRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPayments(UUID propertyId) {
        List<Payment> payments = paymentRepository.findByPropertyIdOrderByPaymentTimeDesc(propertyId);
        Map<UUID, Reservation> reservationsById = loadReservationsFor(payments.stream().map(Payment::getReservationId));
        return payments.stream()
                .map(p -> mapToPaymentDto(p, reservationsById.get(p.getReservationId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> getInvoices(UUID propertyId) {
        List<Invoice> invoices = invoiceRepository.findByPropertyIdOrderByIssuedAtDesc(propertyId);
        Map<UUID, Reservation> reservationsById = loadReservationsFor(invoices.stream().map(Invoice::getReservationId));
        return invoices.stream()
                .map(i -> {
                    Reservation reservation = reservationsById.get(i.getReservationId());
                    String guestName = reservation != null ? guestDisplayName(reservation.getMainGuest()) : "Unknown Guest";
                    return new InvoiceDto(i.getId(), i.getInvoiceNumber(), i.getReservationId(), guestName, i.getInvoiceType(), i.getSubtotal(), i.getTaxAmount(), i.getGrandTotal(), i.getStatus(), i.getIssuedAt());
                })
                .collect(Collectors.toList());
    }

    private Map<UUID, Reservation> loadReservationsFor(Stream<UUID> reservationIds) {
        List<UUID> ids = reservationIds.distinct().collect(Collectors.toList());
        return reservationRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Reservation::getId, r -> r));
    }

    private String guestDisplayName(Guest guest) {
        return guest.getFirstName() + " " + guest.getLastName();
    }

    @Transactional
    public PaymentDto recordPayment(UUID propertyId, RecordPaymentRequest request, UUID userId) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Reservation not found"));

        int year = LocalDate.now().getYear();
        String payNumber = generateSequenceNumber(propertyId, "PAYMENT", "PAY", year);
        String rctNumber = generateSequenceNumber(propertyId, "RECEIPT", "RCT", year);

        Payment payment = new Payment();
        payment.setPropertyId(propertyId);
        payment.setPaymentNumber(payNumber);
        payment.setReservationId(reservation.getId());
        payment.setGuestId(reservation.getMainGuest().getId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH");
        payment.setPaymentKind(request.getPaymentKind() != null ? request.getPaymentKind() : "PAYMENT");
        payment.setStatus("COMPLETED");
        payment.setTransactionReference(request.getTransactionReference());
        payment.setNotes(request.getNotes());
        payment.setCreatedBy(userId);

        Payment savedPayment = paymentRepository.save(payment);

        // Update reservation folio
        BigDecimal newPaid = reservation.getPaidAmount().add(request.getAmount());
        BigDecimal newBalance = reservation.getTotalAmount().subtract(newPaid);
        reservation.setPaidAmount(newPaid);
        reservation.setBalanceDue(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            reservation.setPaymentStatus("PAID");
        } else {
            reservation.setPaymentStatus("PARTIALLY_PAID");
        }
        reservationRepository.save(reservation);

        // Issue Receipt
        Receipt receipt = new Receipt();
        receipt.setPropertyId(propertyId);
        receipt.setReceiptNumber(rctNumber);
        receipt.setPaymentId(savedPayment.getId());
        receipt.setReservationId(reservation.getId());
        receipt.setGuestId(reservation.getMainGuest().getId());
        receipt.setAmount(request.getAmount());
        receipt.setCreatedBy(userId);
        receiptRepository.save(receipt);

        return mapToPaymentDto(savedPayment, reservation);
    }

    private String generateSequenceNumber(UUID propertyId, String sequenceType, String prefix, int year) {
        DocumentSequence sequence = documentSequenceRepository
                .findByPropertyIdAndSequenceTypeAndYear(propertyId, sequenceType, year)
                .orElseGet(() -> {
                    DocumentSequence ds = new DocumentSequence();
                    ds.setPropertyId(propertyId);
                    ds.setSequenceType(sequenceType);
                    ds.setYear(year);
                    ds.setCurrentValue(0L);
                    return ds;
                });

        long nextVal = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextVal);
        documentSequenceRepository.save(sequence);

        return String.format("%s-%d-%06d", prefix, year, nextVal);
    }

    private PaymentDto mapToPaymentDto(Payment p, Reservation reservation) {
        return new PaymentDto(
                p.getId(),
                p.getPaymentNumber(),
                p.getReservationId(),
                reservation != null ? reservation.getReservationNumber() : "Unknown",
                reservation != null ? guestDisplayName(reservation.getMainGuest()) : "Unknown Guest",
                p.getAmount(),
                p.getPaymentMethod(),
                p.getPaymentKind(),
                p.getStatus(),
                p.getTransactionReference(),
                p.getPaymentTime()
        );
    }
}
