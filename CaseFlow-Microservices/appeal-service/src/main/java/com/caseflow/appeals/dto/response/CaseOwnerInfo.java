package com.caseflow.appeals.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Lean inter-service DTO — captures only ownership and status fields
 * from the case-service CaseResponse.
 * Jackson ignores all other fields (caseId, title, filedDate, etc.).
 * Used in AppealService to validate ownership before filing an appeal.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CaseOwnerInfo {
    private String litigantId;
    private String lawyerId;   // nullable — not every case has an assigned lawyer
    private String status;     // FILED | ACTIVE | ADJOURNED | CLOSED
}
