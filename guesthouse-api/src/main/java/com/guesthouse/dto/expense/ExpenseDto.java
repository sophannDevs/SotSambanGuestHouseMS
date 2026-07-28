package com.guesthouse.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDto {
    private UUID id;
    private String expenseNumber;
    private String category;
    private String description;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String vendor;
    private String paymentMethod;
    private String approvalStatus;
    private String notes;
}
