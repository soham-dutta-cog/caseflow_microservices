package com.caseflow.appeals.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class AppealRequest {
    @NotNull private Long caseId;
    @NotNull private Long filedByUserId;
    @NotBlank private String reason;
}
