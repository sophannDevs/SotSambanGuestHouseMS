package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.expense.CreateExpenseRequest;
import com.guesthouse.dto.expense.ExpenseDto;
import com.guesthouse.entity.DocumentSequence;
import com.guesthouse.entity.Expense;
import com.guesthouse.repository.DocumentSequenceRepository;
import com.guesthouse.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final DocumentSequenceRepository documentSequenceRepository;

    public ExpenseService(ExpenseRepository expenseRepository, DocumentSequenceRepository documentSequenceRepository) {
        this.expenseRepository = expenseRepository;
        this.documentSequenceRepository = documentSequenceRepository;
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpenses(UUID propertyId) {
        return expenseRepository.findByPropertyIdOrderByExpenseDateDesc(propertyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseDto createExpense(UUID propertyId, CreateExpenseRequest request, UUID userId) {
        int year = LocalDate.now().getYear();
        String expNumber = generateExpenseNumber(propertyId, year);

        Expense expense = new Expense();
        expense.setPropertyId(propertyId);
        expense.setExpenseNumber(expNumber);
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now());
        expense.setVendor(request.getVendor());
        expense.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH");
        expense.setApprovalStatus("APPROVED"); // Auto approve in local mode
        expense.setApprovedBy(userId);
        expense.setNotes(request.getNotes());
        expense.setCreatedBy(userId);

        Expense saved = expenseRepository.save(expense);
        return mapToDto(saved);
    }

    @Transactional
    public ExpenseDto approveExpense(UUID propertyId, UUID id, UUID userId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Expense not found"));

        expense.setApprovalStatus("APPROVED");
        expense.setApprovedBy(userId);

        Expense saved = expenseRepository.save(expense);
        return mapToDto(saved);
    }

    private String generateExpenseNumber(UUID propertyId, int year) {
        DocumentSequence sequence = documentSequenceRepository
                .findByPropertyIdAndSequenceTypeAndYear(propertyId, "EXPENSE", year)
                .orElseGet(() -> {
                    DocumentSequence ds = new DocumentSequence();
                    ds.setPropertyId(propertyId);
                    ds.setSequenceType("EXPENSE");
                    ds.setYear(year);
                    ds.setCurrentValue(0L);
                    return ds;
                });

        long nextVal = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextVal);
        documentSequenceRepository.save(sequence);

        return String.format("EXP-%d-%06d", year, nextVal);
    }

    private ExpenseDto mapToDto(Expense e) {
        return new ExpenseDto(e.getId(), e.getExpenseNumber(), e.getCategory(), e.getDescription(), e.getAmount(), e.getExpenseDate(), e.getVendor(), e.getPaymentMethod(), e.getApprovalStatus(), e.getNotes());
    }
}
