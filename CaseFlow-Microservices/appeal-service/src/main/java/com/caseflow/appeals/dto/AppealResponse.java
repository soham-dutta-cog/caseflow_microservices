package com.caseflow.appeals.dto;
import com.caseflow.appeals.entity.Appeal.AppealStatus;
import lombok.*;
import java.time.LocalDate;
@Data @Builder
public class AppealResponse {
    private Long appealId; private Long caseId; private Long filedByUserId;
    private LocalDate filedDate; private String reason; private AppealStatus status;
}
