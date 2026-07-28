package com.guesthouse.dto.report;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FinancialReportDto {
    private BigDecimal grossRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal netProfitLoss;
    private BigDecimal occupancyRate; // %
    private BigDecimal averageDailyRate; // ADR ($)
    private BigDecimal revPar; // RevPAR ($)
}
