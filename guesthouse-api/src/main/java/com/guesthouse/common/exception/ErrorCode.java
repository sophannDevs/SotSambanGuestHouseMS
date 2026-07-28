package com.guesthouse.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // General & System
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "An internal server error occurred"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed for request parameters"),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "Invalid parameter supplied"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Requested resource was not found"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "HTTP method not allowed for endpoint"),
    OPTIMISTIC_LOCK_CONFLICT(HttpStatus.CONFLICT, "Resource was modified concurrently. Please refresh and try again."),
    INVALID_STATE_TRANSITION(HttpStatus.CONFLICT, "Invalid state transition"),

    // Auth & Access
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Authentication credentials missing or invalid"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Invalid username or password"),
    PERMISSION_DENIED(HttpStatus.FORBIDDEN, "Permission denied for this operation"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Access or refresh token has expired"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Invalid access or refresh token"),
    ACCOUNT_LOCKED(HttpStatus.FORBIDDEN, "Account is locked due to multiple failed attempts"),
    SESSION_EXPIRED(HttpStatus.UNAUTHORIZED, "Session has expired"),

    // Property & Setup
    PROPERTY_NOT_FOUND(HttpStatus.NOT_FOUND, "Property not found"),
    ONBOARDING_INCOMPLETE(HttpStatus.BAD_REQUEST, "Property onboarding is incomplete"),

    // Rooms & Rates
    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "Room not found"),
    ROOM_NOT_AVAILABLE(HttpStatus.CONFLICT, "Room is not available for requested dates"),
    ROOM_ALREADY_OCCUPIED(HttpStatus.CONFLICT, "Room is currently occupied"),
    ROOM_BLOCKED(HttpStatus.CONFLICT, "Room is currently blocked"),
    ROOM_UNDER_MAINTENANCE(HttpStatus.CONFLICT, "Room is under maintenance"),
    ROOM_OUT_OF_SERVICE(HttpStatus.CONFLICT, "Room is out of service"),
    ROOM_NOT_CLEAN(HttpStatus.CONFLICT, "Room is dirty and requires cleaning"),
    ROOM_CAPACITY_EXCEEDED(HttpStatus.UNPROCESSABLE_ENTITY, "Guest count exceeds room capacity"),

    // Reservations & Stays
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Reservation not found"),
    INVALID_DATE_RANGE(HttpStatus.BAD_REQUEST, "Invalid date range specified"),
    DEPOSIT_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY, "Deposit payment is required before action"),
    STAY_NOT_IN_PROGRESS(HttpStatus.BAD_REQUEST, "Stay is not currently active"),

    // Folios & Payments
    OUTSTANDING_BALANCE(HttpStatus.UNPROCESSABLE_ENTITY, "Outstanding balance must be settled"),
    INVOICE_FINALIZED(HttpStatus.UNPROCESSABLE_ENTITY, "Issued invoice cannot be edited");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
