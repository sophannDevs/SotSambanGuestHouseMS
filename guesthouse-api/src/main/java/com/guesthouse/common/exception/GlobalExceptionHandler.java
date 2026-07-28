package com.guesthouse.common.exception;

import com.guesthouse.common.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        String requestId = getOrGenerateRequestId(request);
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("Business error [{}]: {} (requestId: {})", errorCode, ex.getMessage(), requestId);

        ApiError error = new ApiError(errorCode.name(), ex.getMessage(), null, requestId);
        return new ResponseEntity<>(error, errorCode.getHttpStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String requestId = getOrGenerateRequestId(request);
        List<ApiError.FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiError.FieldErrorDetail(fe.getField(), "INVALID_FORMAT", fe.getDefaultMessage()))
                .toList();

        ApiError error = new ApiError(ErrorCode.VALIDATION_ERROR.name(), ErrorCode.VALIDATION_ERROR.getDefaultMessage(), fieldErrors, requestId);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
        String requestId = getOrGenerateRequestId(request);
        log.error("Unhandled exception occurred (requestId: {})", requestId, ex);

        ApiError error = new ApiError(ErrorCode.INTERNAL_SERVER_ERROR.name(), ErrorCode.INTERNAL_SERVER_ERROR.getDefaultMessage(), null, requestId);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String getOrGenerateRequestId(HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = "local-" + UUID.randomUUID().toString().substring(0, 8);
        }
        return requestId;
    }
}
