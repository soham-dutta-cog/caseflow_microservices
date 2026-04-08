package com.caseflow.appeals.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class UpdateOutcomeRequest {
    @NotBlank private String outcome;
}
