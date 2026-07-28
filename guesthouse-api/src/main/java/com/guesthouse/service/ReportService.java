package com.guesthouse.service;

import com.guesthouse.dto.report.FinancialReportDto;
import com.guesthouse.entity.Expense;
import com.guesthouse.entity.Booking;
import com.guesthouse.repository.ExpenseRepository;
import com.guesthouse.repository.BookingRepository;
import com.guesthouse.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    private final BookingRepository bookingRepository;
    private final ExpenseRepository expenseRepository;
    private final RoomRepository roomRepository;

    public ReportService(
            BookingRepository bookingRepository,
            ExpenseRepository expenseRepository,
            RoomRepository roomRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.expenseRepository = expenseRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public FinancialReportDto getFinancialReport(UUID propertyId) {
        List<Booking> bookings = bookingRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId);
        List<Expense> expenses = expenseRepository.findByPropertyIdAndApprovalStatus(propertyId, "APPROVED");
        long totalRooms = Math.max(1, roomRepository.count());

        BigDecimal grossRevenue = bookings.stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getBookingStatus()))
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfitLoss = grossRevenue.subtract(totalExpenses);

        long totalNightsOccupied = bookings.stream()
                .filter(b -> "CHECKED_IN".equalsIgnoreCase(b.getBookingStatus()) || "CHECKED_OUT".equalsIgnoreCase(b.getBookingStatus()))
                .mapToLong(Booking::getTotalNights)
                .sum();

        BigDecimal occupancyRate = BigDecimal.valueOf(totalNightsOccupied * 100)
                .divide(BigDecimal.valueOf(totalRooms * 30), 2, RoundingMode.HALF_UP);

        BigDecimal adr = totalNightsOccupied > 0
                ? grossRevenue.divide(BigDecimal.valueOf(totalNightsOccupied), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal revPar = adr.multiply(occupancyRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        return new FinancialReportDto(grossRevenue, totalExpenses, netProfitLoss, occupancyRate, adr, revPar);
    }
}
