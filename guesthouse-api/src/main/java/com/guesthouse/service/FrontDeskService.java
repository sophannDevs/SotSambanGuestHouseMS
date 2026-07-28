package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.frontdesk.CheckInRequest;
import com.guesthouse.dto.frontdesk.CheckOutRequest;
import com.guesthouse.dto.reservation.ReservationDto;
import com.guesthouse.entity.CheckIn;
import com.guesthouse.entity.CheckOut;
import com.guesthouse.entity.Reservation;
import com.guesthouse.entity.Room;
import com.guesthouse.repository.CheckInRepository;
import com.guesthouse.repository.CheckOutRepository;
import com.guesthouse.repository.ReservationRepository;
import com.guesthouse.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FrontDeskService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final CheckInRepository checkInRepository;
    private final CheckOutRepository checkOutRepository;
    private final ReservationService reservationService;

    public FrontDeskService(
            ReservationRepository reservationRepository,
            RoomRepository roomRepository,
            CheckInRepository checkInRepository,
            CheckOutRepository checkOutRepository,
            ReservationService reservationService
    ) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.checkInRepository = checkInRepository;
        this.checkOutRepository = checkOutRepository;
        this.reservationService = reservationService;
    }

    @Transactional
    public ReservationDto executeCheckIn(UUID propertyId, CheckInRequest request, UUID userId) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Reservation not found"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room not found"));

        if (!"AVAILABLE".equalsIgnoreCase(room.getOperationalStatus()) && !"OCCUPIED".equalsIgnoreCase(room.getOperationalStatus())) {
            throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE, "Room is not available for check-in");
        }

        // 1. Update reservation to CHECKED_IN
        reservationService.updateStatus(propertyId, reservation.getId(), "CHECKED_IN", userId, "Front desk check-in");

        // 2. Update room operational status to OCCUPIED
        room.setOperationalStatus("OCCUPIED");
        room.setUpdatedBy(userId);
        roomRepository.save(room);

        // 3. Save CheckIn record
        CheckIn checkIn = new CheckIn();
        checkIn.setPropertyId(propertyId);
        checkIn.setReservationId(reservation.getId());
        checkIn.setRoomId(room.getId());
        checkIn.setGuestId(reservation.getMainGuest().getId());
        checkIn.setKeyNumber(request.getKeyNumber());
        checkIn.setHouseRulesAccepted(request.isHouseRulesAccepted());
        checkIn.setVehiclePlate(request.getVehiclePlate());
        checkIn.setNotes(request.getNotes());
        checkIn.setCreatedBy(userId);
        checkInRepository.save(checkIn);

        return reservationService.getReservation(propertyId, reservation.getId());
    }

    @Transactional
    public ReservationDto executeCheckOut(UUID propertyId, CheckOutRequest request, UUID userId) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Reservation not found"));

        Room room = reservation.getAssignedRoom();

        // 1. Update reservation status to CHECKED_OUT
        reservationService.updateStatus(propertyId, reservation.getId(), "CHECKED_OUT", userId, "Front desk check-out");

        // 2. Update room operational status to AVAILABLE & housekeeping to DIRTY
        if (room != null) {
            room.setOperationalStatus("AVAILABLE");
            room.setHousekeepingStatus("DIRTY");
            room.setUpdatedBy(userId);
            roomRepository.save(room);
        }

        // 3. Save CheckOut record
        CheckOut checkOut = new CheckOut();
        checkOut.setPropertyId(propertyId);
        checkOut.setReservationId(reservation.getId());
        checkOut.setRoomId(room != null ? room.getId() : UUID.randomUUID());
        checkOut.setGuestId(reservation.getMainGuest().getId());
        checkOut.setKeyReturned(request.isKeyReturned());
        checkOut.setNotes(request.getNotes());
        checkOut.setCreatedBy(userId);
        checkOutRepository.save(checkOut);

        return reservationService.getReservation(propertyId, reservation.getId());
    }
}
