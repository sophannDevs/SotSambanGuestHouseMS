package com.guesthouse.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    private boolean success = false;
    private String code;
    private String message;
    private List<FieldErrorDetail> fieldErrors;
    private OffsetDateTime timestamp;
    private String requestId;

    public ApiError() {
        this.timestamp = OffsetDateTime.now();
    }

    public ApiError(String code, String message, List<FieldErrorDetail> fieldErrors, String requestId) {
        this.success = false;
        this.code = code;
        this.message = message;
        this.fieldErrors = fieldErrors;
        this.timestamp = OffsetDateTime.now();
        this.requestId = requestId;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<FieldErrorDetail> getFieldErrors() {
        return fieldErrors;
    }

    public void setFieldErrors(List<FieldErrorDetail> fieldErrors) {
        this.fieldErrors = fieldErrors;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FieldErrorDetail {
        private String field;
        private String code;
        private String message;

        public FieldErrorDetail() {}

        public FieldErrorDetail(String field, String code, String message) {
            this.field = field;
            this.code = code;
            this.message = message;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
