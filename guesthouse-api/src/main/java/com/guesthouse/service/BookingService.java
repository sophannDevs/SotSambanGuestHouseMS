package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.booking.CreateBookingRequest;
import com.guesthouse.dto.booking.BookingDto;
import com.guesthouse.dto.guest.GuestDto;
import com.guesthouse.entity.*;
import com.guesthouse.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final GuestRepository guestRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final DocumentSequenceRepository documentSequenceRepository;
    private final BookingStatusHistoryRepository bookingStatusHistoryRepository;

    public BookingService(
            BookingRepository bookingRepository,
            GuestRepository guestRepository,
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            DocumentSequenceRepository documentSequenceRepository,
            BookingStatusHistoryRepository bookingStatusHistoryRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.guestRepository = guestRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.documentSequenceRepository = documentSequenceRepository;
        this.bookingStatusHistoryRepository = bookingStatusHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getBookings(UUID propertyId) {
        return bookingRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingDto getBooking(UUID propertyId, UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));
        return mapToDto(booking);
    }

    @Transactional
    public BookingDto createBooking(UUID propertyId, CreateBookingRequest request, UUID userId) {
        Guest guest = guestRepository.findById(request.getMainGuestId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Guest not found"));

        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room type not found"));

        Room assignedRoom = null;
        if (request.getAssignedRoomId() != null) {
            assignedRoom = roomRepository.findById(request.getAssignedRoomId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Assigned room not found"));
        }

        long nights = ChronoUnit.DAYS.between(request.getArrivalDate(), request.getDepartureDate());
        if (nights < 1) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "Departure date must be after arrival date");
        }

        BigDecimal rate = request.getBaseRate() != null ? request.getBaseRate() : roomType.getBasePrice();
        BigDecimal subtotal = rate.multiply(BigDecimal.valueOf(nights));
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.10")); // 10% VAT tax
        BigDecimal total = subtotal.add(tax);

        String bkgNumber = generateBookingNumber(propertyId, request.getArrivalDate().getYear());

        Booking booking = new Booking();
        booking.setPropertyId(propertyId);
        booking.setBookingNumber(bkgNumber);
        booking.setMainGuest(guest);
        booking.setRoomType(roomType);
        booking.setAssignedRoom(assignedRoom);
        booking.setArrivalDate(request.getArrivalDate());
        booking.setDepartureDate(request.getDepartureDate());
        booking.setTotalNights((int) nights);
        booking.setAdults(request.getAdults() != null ? request.getAdults() : 1);
        booking.setChildren(request.getChildren() != null ? request.getChildren() : 0);
        booking.setBaseRate(rate);
        booking.setTaxAmount(tax);
        booking.setTotalAmount(total);
        booking.setPaidAmount(BigDecimal.ZERO);
        booking.setBalanceDue(total);
        booking.setBookingStatus("CONFIRMED");
        booking.setPaymentStatus("UNPAID");
        booking.setSource(request.getSource() != null ? request.getSource() : "DIRECT_WALK_IN");
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setInternalNotes(request.getInternalNotes());
        booking.setCreatedBy(userId);

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingDto updateStatus(UUID propertyId, UUID id, String newStatus, UUID userId, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

        String oldStatus = booking.getBookingStatus();
        validateStatusTransition(oldStatus, newStatus);

        booking.setBookingStatus(newStatus);
        booking.setUpdatedBy(userId);

        Booking saved = bookingRepository.save(booking);

        BookingStatusHistory history = new BookingStatusHistory();
        history.setBookingId(id);
        history.setPreviousStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(userId);
        history.setReason(reason != null ? reason : "Status updated to " + newStatus);
        bookingStatusHistoryRepository.save(history);

        return mapToDto(saved);
    }

    private String generateBookingNumber(UUID propertyId, int year) {
        DocumentSequence sequence = documentSequenceRepository
                .findByPropertyIdAndSequenceTypeAndYear(propertyId, "BOOKING", year)
                .orElseGet(() -> {
                    DocumentSequence ds = new DocumentSequence();
                    ds.setPropertyId(propertyId);
                    ds.setSequenceType("BOOKING");
                    ds.setYear(year);
                    ds.setCurrentValue(0L);
                    return ds;
                });

        long nextVal = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextVal);
        documentSequenceRepository.save(sequence);

        return String.format("BKG-%d-%06d", year, nextVal);
    }

    private void validateStatusTransition(String current, String target) {
        if (current.equals(target)) return;

        // Check valid transitions per business-rules.md Section 9.8 / FR-093
        boolean valid = switch (current) {
            case "DRAFT" -> List.of("PENDING", "CONFIRMED", "CANCELLED").contains(target);
            case "PENDING" -> List.of("CONFIRMED", "CANCELLED").contains(target);
            case "CONFIRMED" -> List.of("CHECKED_IN", "CANCELLED", "NO_SHOW").contains(target);
            case "CHECKED_IN" -> List.of("CHECKED_OUT").contains(target);
            default -> false;
        };

        if (!valid) {
            throw new BusinessException(ErrorCode.INVALID_STATE_TRANSITION, "Invalid state transition from " + current + " to " + target);
        }
    }

    private BookingDto mapToDto(Booking b) {
        Guest g = b.getMainGuest();
        GuestDto guestDto = new GuestDto(g.getId(), g.getFirstName(), g.getLastName(), g.getEmail(), g.getPhone(), g.getIdPassportNumber(), g.getNationality(), g.getVipLevel(), g.getNotes());

        return new BookingDto(
                b.getId(),
                b.getBookingNumber(),
                guestDto,
                b.getRoomType().getId(),
                b.getRoomType().getName(),
                b.getAssignedRoom() != null ? b.getAssignedRoom().getId() : null,
                b.getAssignedRoom() != null ? b.getAssignedRoom().getRoomNumber() : null,
                b.getArrivalDate(),
                b.getDepartureDate(),
                b.getTotalNights(),
                b.getAdults(),
                b.getChildren(),
                b.getBaseRate(),
                b.getDiscountAmount(),
                b.getTaxAmount(),
                b.getTotalAmount(),
                b.getPaidAmount(),
                b.getBalanceDue(),
                b.getBookingStatus(),
                b.getPaymentStatus(),
                b.getSource(),
                b.getExternalReference(),
                b.getSpecialRequests(),
                b.getInternalNotes(),
                b.getVersion()
        );
    }
}
