package com.guesthouse.dto.booking;

import com.guesthouse.dto.room.RoomDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CalendarTimelineDto {
    private List<RoomDto> rooms;
    private List<BookingDto> bookings;
}
