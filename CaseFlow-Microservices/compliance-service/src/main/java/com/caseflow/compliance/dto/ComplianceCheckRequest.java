package com.caseflow.compliance.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
@Data
public class ComplianceCheckRequest { @NotNull private Long adminId; private List<Long> caseIds; }
