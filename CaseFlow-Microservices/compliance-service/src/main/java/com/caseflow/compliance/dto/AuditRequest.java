package com.caseflow.compliance.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class AuditRequest { @NotNull private Long adminId; @NotBlank private String scope; private String findings; }
