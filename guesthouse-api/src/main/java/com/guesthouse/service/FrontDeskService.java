package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.frontdesk.CheckInRequest;
import com.guesthouse.dto.frontdesk.CheckOutRequest;
import com.guesthouse.dto.booking.BookingDto;
import com.guesthouse.entity.Booking;
import com.guesthouse.entity.CheckIn;
import com.guesthouse.entity.CheckOut;
import com.guesthouse.entity.Room;
import com.guesthouse.repository.BookingRepository;
import com.guesthouse.repository.CheckInRepository;
import com.guesthouse.repository.CheckOutRepository;
import com.guesthouse.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class FrontDeskService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final CheckInRepository checkInRepository;
    private final CheckOutRepository checkOutRepository;
    private final BookingService bookingService;
    private final RoomService roomService;

    public FrontDeskService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            CheckInRepository checkInRepository,
            CheckOutRepository checkOutRepository,
            BookingService bookingService,
            RoomService roomService
    ) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.checkInRepository = checkInRepository;
        this.checkOutRepository = checkOutRepository;
        this.bookingService = bookingService;
        this.roomService = roomService;
    }

    @Transactional
    public BookingDto executeCheckIn(UUID propertyId, CheckInRequest request, UUID userId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Room not found"));

        if (!"AVAILABLE".equalsIgnoreCase(room.getOperationalStatus()) && !"OCCUPIED".equalsIgnoreCase(room.getOperationalStatus())) {
            throw new BusinessException(ErrorCode.ROOM_NOT_AVAILABLE, "Room is not available for check-in");
        }

        // 1. Update booking to CHECKED_IN
        bookingService.updateStatus(propertyId, booking.getId(), "CHECKED_IN", userId, "Front desk check-in");

        // 2. Update room operational status to OCCUPIED
        room.setOperationalStatus("OCCUPIED");
        room.setUpdatedBy(userId);
        roomRepository.save(room);
        roomService.evictRoomAvailabilityCache();

        // 3. Save CheckIn record
        CheckIn checkIn = new CheckIn();
        checkIn.setPropertyId(propertyId);
        checkIn.setBookingId(booking.getId());
        checkIn.setRoomId(room.getId());
        checkIn.setGuestId(booking.getMainGuest().getId());
        checkIn.setKeyNumber(request.getKeyNumber());
        checkIn.setHouseRulesAccepted(request.isHouseRulesAccepted());
        checkIn.setVehiclePlate(request.getVehiclePlate());
        checkIn.setNotes(request.getNotes());
        checkIn.setCreatedBy(userId);
        checkInRepository.save(checkIn);

        return bookingService.getBooking(propertyId, booking.getId());
    }

    @Transactional
    public BookingDto executeCheckOut(UUID propertyId, CheckOutRequest request, UUID userId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

        Room room = booking.getAssignedRoom();

        // 1. Update booking status to CHECKED_OUT
        bookingService.updateStatus(propertyId, booking.getId(), "CHECKED_OUT", userId, "Front desk check-out");

        // 2. Update room operational status to AVAILABLE & housekeeping to DIRTY
        if (room != null) {
            room.setOperationalStatus("AVAILABLE");
            room.setHousekeepingStatus("DIRTY");
            room.setUpdatedBy(userId);
            roomRepository.save(room);
            roomService.evictRoomAvailabilityCache();
        }

        // 3. Save CheckOut record
        CheckOut checkOut = new CheckOut();
        checkOut.setPropertyId(propertyId);
        checkOut.setBookingId(booking.getId());
        checkOut.setRoomId(room != null ? room.getId() : UUID.randomUUID());
        checkOut.setGuestId(booking.getMainGuest().getId());
        checkOut.setKeyReturned(request.isKeyReturned());
        checkOut.setNotes(request.getNotes());
        checkOut.setCreatedBy(userId);
        checkOutRepository.save(checkOut);

        return bookingService.getBooking(propertyId, booking.getId());
    }
}
