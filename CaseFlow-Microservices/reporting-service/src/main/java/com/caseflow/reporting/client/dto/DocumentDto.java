package com.caseflow.reporting.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocumentDto {
    private Long documentId;
    private Long caseId;
    private String title;
    private String type;                  // PETITION, EVIDENCE, etc.
    private String verificationStatus;    // PENDING, VERIFIED, REJECTED
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
