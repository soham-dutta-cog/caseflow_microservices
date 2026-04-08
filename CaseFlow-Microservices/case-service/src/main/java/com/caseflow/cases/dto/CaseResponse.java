package com.caseflow.cases.dto;
import com.caseflow.cases.entity.Case;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CaseResponse {
    private Long caseId; private String title; private Long litigantId;
    private Long lawyerId; private LocalDateTime filedDate; private Case.CaseStatus status;
}
