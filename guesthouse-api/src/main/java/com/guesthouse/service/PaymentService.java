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
    private final BookingRepository bookingRepository;
    private final DocumentSequenceRepository documentSequenceRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            ReceiptRepository receiptRepository,
            BookingRepository bookingRepository,
            DocumentSequenceRepository documentSequenceRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.receiptRepository = receiptRepository;
        this.bookingRepository = bookingRepository;
        this.documentSequenceRepository = documentSequenceRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPayments(UUID propertyId) {
        List<Payment> payments = paymentRepository.findByPropertyIdOrderByPaymentTimeDesc(propertyId);
        Map<UUID, Booking> bookingsById = loadBookingsFor(payments.stream().map(Payment::getBookingId));
        return payments.stream()
                .map(p -> mapToPaymentDto(p, bookingsById.get(p.getBookingId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> getInvoices(UUID propertyId) {
        List<Invoice> invoices = invoiceRepository.findByPropertyIdOrderByIssuedAtDesc(propertyId);
        Map<UUID, Booking> bookingsById = loadBookingsFor(invoices.stream().map(Invoice::getBookingId));
        return invoices.stream()
                .map(i -> {
                    Booking booking = bookingsById.get(i.getBookingId());
                    String guestName = booking != null ? guestDisplayName(booking.getMainGuest()) : "Unknown Guest";
                    return new InvoiceDto(i.getId(), i.getInvoiceNumber(), i.getBookingId(), guestName, i.getInvoiceType(), i.getSubtotal(), i.getTaxAmount(), i.getGrandTotal(), i.getStatus(), i.getIssuedAt());
                })
                .collect(Collectors.toList());
    }

    private Map<UUID, Booking> loadBookingsFor(Stream<UUID> bookingIds) {
        List<UUID> ids = bookingIds.distinct().collect(Collectors.toList());
        return bookingRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Booking::getId, b -> b));
    }

    private String guestDisplayName(Guest guest) {
        return guest.getFirstName() + " " + guest.getLastName();
    }

    @Transactional
    public PaymentDto recordPayment(UUID propertyId, RecordPaymentRequest request, UUID userId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

        int year = LocalDate.now().getYear();
        String payNumber = generateSequenceNumber(propertyId, "PAYMENT", "PAY", year);
        String rctNumber = generateSequenceNumber(propertyId, "RECEIPT", "RCT", year);

        Payment payment = new Payment();
        payment.setPropertyId(propertyId);
        payment.setPaymentNumber(payNumber);
        payment.setBookingId(booking.getId());
        payment.setGuestId(booking.getMainGuest().getId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH");
        payment.setPaymentKind(request.getPaymentKind() != null ? request.getPaymentKind() : "PAYMENT");
        payment.setStatus("COMPLETED");
        payment.setTransactionReference(request.getTransactionReference());
        payment.setNotes(request.getNotes());
        payment.setCreatedBy(userId);

        Payment savedPayment = paymentRepository.save(payment);

        // Update booking folio
        BigDecimal newPaid = booking.getPaidAmount().add(request.getAmount());
        BigDecimal newBalance = booking.getTotalAmount().subtract(newPaid);
        booking.setPaidAmount(newPaid);
        booking.setBalanceDue(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            booking.setPaymentStatus("PAID");
        } else {
            booking.setPaymentStatus("PARTIALLY_PAID");
        }
        bookingRepository.save(booking);

        // Issue Receipt
        Receipt receipt = new Receipt();
        receipt.setPropertyId(propertyId);
        receipt.setReceiptNumber(rctNumber);
        receipt.setPaymentId(savedPayment.getId());
        receipt.setBookingId(booking.getId());
        receipt.setGuestId(booking.getMainGuest().getId());
        receipt.setAmount(request.getAmount());
        receipt.setCreatedBy(userId);
        receiptRepository.save(receipt);

        return mapToPaymentDto(savedPayment, booking);
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

    private PaymentDto mapToPaymentDto(Payment p, Booking booking) {
        return new PaymentDto(
                p.getId(),
                p.getPaymentNumber(),
                p.getBookingId(),
                booking != null ? booking.getBookingNumber() : "Unknown",
                booking != null ? guestDisplayName(booking.getMainGuest()) : "Unknown Guest",
                p.getAmount(),
                p.getPaymentMethod(),
                p.getPaymentKind(),
                p.getStatus(),
                p.getTransactionReference(),
                p.getPaymentTime()
        );
    }
}
