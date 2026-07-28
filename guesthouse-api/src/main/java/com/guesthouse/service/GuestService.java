package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.guest.GuestDto;
import com.guesthouse.entity.Guest;
import com.guesthouse.repository.GuestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GuestService {

    private final GuestRepository guestRepository;

    public GuestService(GuestRepository guestRepository) {
        this.guestRepository = guestRepository;
    }

    @Transactional(readOnly = true)
    public List<GuestDto> getGuests(UUID propertyId, String query) {
        List<Guest> guests = (query != null && !query.isBlank())
                ? guestRepository.findByPropertyIdAndLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(propertyId, query, query)
                : guestRepository.findByPropertyIdAndDeletedAtIsNullOrderByLastNameAscFirstNameAsc(propertyId);

        return guests.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public GuestDto createGuest(UUID propertyId, GuestDto dto) {
        Guest guest = new Guest();
        guest.setPropertyId(propertyId);
        guest.setFirstName(dto.getFirstName());
        guest.setLastName(dto.getLastName());
        guest.setEmail(dto.getEmail());
        guest.setPhone(dto.getPhone());
        guest.setIdPassportNumber(dto.getIdPassportNumber());
        if (dto.getNationality() != null) guest.setNationality(dto.getNationality());
        if (dto.getVipLevel() != null) guest.setVipLevel(dto.getVipLevel());
        guest.setNotes(dto.getNotes());

        Guest saved = guestRepository.save(guest);
        return mapToDto(saved);
    }

    private GuestDto mapToDto(Guest guest) {
        return new GuestDto(
                guest.getId(),
                guest.getFirstName(),
                guest.getLastName(),
                guest.getEmail(),
                guest.getPhone(),
                guest.getIdPassportNumber(),
                guest.getNationality(),
                guest.getVipLevel(),
                guest.getNotes()
        );
    }
}
