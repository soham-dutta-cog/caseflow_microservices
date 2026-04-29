package com.caseflow.compliance.dto;

import com.caseflow.compliance.entity.ComplianceRecord.*;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
public class ComplianceRecordResponse {
    private Long complianceId;
    private Long caseId;
    private ComplianceType type;
    private ComplianceResult result;
    private LocalDate date;
    private String notes;
}
