package com.guesthouse.dto.expense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateExpenseRequest {

    @NotBlank(message = "Expense category is required")
    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private LocalDate expenseDate = LocalDate.now();
    private String vendor;
    private String paymentMethod = "CASH";
    private String notes;
}
