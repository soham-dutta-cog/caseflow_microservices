package com.caseflow.appeals.dto.response;

import com.caseflow.appeals.entity.Appeal.AppealStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * Response DTO returned for all appeal read/write operations.
 */
@Data
@Builder
public class AppealResponse {
    private Long   appealId;
    private Long   caseId;
    private String filedByUserId;
    private LocalDate filedDate;
    private String reason;
    private AppealStatus status;
}
