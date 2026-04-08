package com.caseflow.reporting.dto;
import com.caseflow.reporting.entity.Report.ReportScope;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class ReportRequest {
    @NotNull private Long requestedBy;
    @NotNull private ReportScope scope;
    @NotBlank private String scopeValue;
}
