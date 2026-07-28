package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.guest.GuestDto;
import com.guesthouse.dto.reservation.CreateReservationRequest;
import com.guesthouse.dto.reservation.ReservationDto;
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
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final DocumentSequenceRepository documentSequenceRepository;
    private final ReservationStatusHistoryRepository reservationStatusHistoryRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            GuestRepository guestRepository,
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            DocumentSequenceRepository documentSequenceRepository,
            ReservationStatusHistoryRepository reservationStatusHistoryRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.guestRepository = guestRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.documentSequenceRepository = documentSequenceRepository;
        this.reservationStatusHistoryRepository = reservationStatusHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> getReservations(UUID propertyId) {
        return reservationRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReservationDto getReservation(UUID propertyId, UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Reservation not found"));
        return mapToDto(reservation);
    }

    @Transactional
    public ReservationDto createReservation(UUID propertyId, CreateReservationRequest request, UUID userId) {
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

        String rsvNumber = generateReservationNumber(propertyId, request.getArrivalDate().getYear());

        Reservation reservation = new Reservation();
        reservation.setPropertyId(propertyId);
        reservation.setReservationNumber(rsvNumber);
        reservation.setMainGuest(guest);
        reservation.setRoomType(roomType);
        reservation.setAssignedRoom(assignedRoom);
        reservation.setArrivalDate(request.getArrivalDate());
        reservation.setDepartureDate(request.getDepartureDate());
        reservation.setTotalNights((int) nights);
        reservation.setAdults(request.getAdults() != null ? request.getAdults() : 1);
        reservation.setChildren(request.getChildren() != null ? request.getChildren() : 0);
        reservation.setBaseRate(rate);
        reservation.setTaxAmount(tax);
        reservation.setTotalAmount(total);
        reservation.setPaidAmount(BigDecimal.ZERO);
        reservation.setBalanceDue(total);
        reservation.setReservationStatus("CONFIRMED");
        reservation.setPaymentStatus("UNPAID");
        reservation.setSource(request.getSource() != null ? request.getSource() : "DIRECT_WALK_IN");
        reservation.setSpecialRequests(request.getSpecialRequests());
        reservation.setInternalNotes(request.getInternalNotes());
        reservation.setCreatedBy(userId);

        Reservation saved = reservationRepository.save(reservation);
        return mapToDto(saved);
    }

    @Transactional
    public ReservationDto updateStatus(UUID propertyId, UUID id, String newStatus, UUID userId, String reason) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Reservation not found"));

        String oldStatus = reservation.getReservationStatus();
        validateStatusTransition(oldStatus, newStatus);

        reservation.setReservationStatus(newStatus);
        reservation.setUpdatedBy(userId);

        Reservation saved = reservationRepository.save(reservation);

        ReservationStatusHistory history = new ReservationStatusHistory();
        history.setReservationId(id);
        history.setPreviousStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(userId);
        history.setReason(reason != null ? reason : "Status updated to " + newStatus);
        reservationStatusHistoryRepository.save(history);

        return mapToDto(saved);
    }

    private String generateReservationNumber(UUID propertyId, int year) {
        DocumentSequence sequence = documentSequenceRepository
                .findByPropertyIdAndSequenceTypeAndYear(propertyId, "RESERVATION", year)
                .orElseGet(() -> {
                    DocumentSequence ds = new DocumentSequence();
                    ds.setPropertyId(propertyId);
                    ds.setSequenceType("RESERVATION");
                    ds.setYear(year);
                    ds.setCurrentValue(0L);
                    return ds;
                });

        long nextVal = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextVal);
        documentSequenceRepository.save(sequence);

        return String.format("RSV-%d-%06d", year, nextVal);
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

    private ReservationDto mapToDto(Reservation r) {
        Guest g = r.getMainGuest();
        GuestDto guestDto = new GuestDto(g.getId(), g.getFirstName(), g.getLastName(), g.getEmail(), g.getPhone(), g.getIdPassportNumber(), g.getNationality(), g.getVipLevel(), g.getNotes());

        return new ReservationDto(
                r.getId(),
                r.getReservationNumber(),
                guestDto,
                r.getRoomType().getId(),
                r.getRoomType().getName(),
                r.getAssignedRoom() != null ? r.getAssignedRoom().getId() : null,
                r.getAssignedRoom() != null ? r.getAssignedRoom().getRoomNumber() : null,
                r.getArrivalDate(),
                r.getDepartureDate(),
                r.getTotalNights(),
                r.getAdults(),
                r.getChildren(),
                r.getBaseRate(),
                r.getDiscountAmount(),
                r.getTaxAmount(),
                r.getTotalAmount(),
                r.getPaidAmount(),
                r.getBalanceDue(),
                r.getReservationStatus(),
                r.getPaymentStatus(),
                r.getSource(),
                r.getExternalReference(),
                r.getSpecialRequests(),
                r.getInternalNotes(),
                r.getVersion()
        );
    }
}
