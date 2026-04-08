package com.caseflow.cases.dto;
import com.caseflow.cases.entity.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DocumentResponse {
    private Long documentId; private Long caseId; private String title;
    private Document.DocumentType type; private String uri;
    private LocalDateTime uploadedDate; private Document.VerificationStatus verificationStatus;
    private Long uploadedBy; private String rejectionReason;
}
