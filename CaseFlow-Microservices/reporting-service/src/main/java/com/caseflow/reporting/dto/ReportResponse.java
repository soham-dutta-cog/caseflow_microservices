package com.caseflow.reporting.dto;
import com.caseflow.reporting.entity.Report.ReportScope;
import lombok.*;
import java.time.LocalDate;
@Data @Builder
public class ReportResponse {
    private Long reportId; private ReportScope scope; private String scopeValue;
    private String metrics; private LocalDate generatedDate; private Long requestedBy;
}
