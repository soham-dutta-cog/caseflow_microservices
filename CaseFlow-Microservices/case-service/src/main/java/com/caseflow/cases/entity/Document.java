package com.caseflow.cases.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long documentId;
    @Column(nullable = false) private Long caseId;
    @Column(nullable = false) private String title;
    @Column(nullable = false) @Enumerated(EnumType.STRING) private DocumentType type;
    @Column(nullable = false) private String uri;
    @Column(nullable = false) private LocalDateTime uploadedDate;
    @Column(nullable = false) @Enumerated(EnumType.STRING) private VerificationStatus verificationStatus;
    @Column(nullable = false) private Long uploadedBy;
    private String rejectionReason;

    public enum DocumentType { PETITION, EVIDENCE, BRIEF, AFFIDAVIT, JUDGMENT, NOTICE, OTHER }
    public enum VerificationStatus { PENDING, VERIFIED, REJECTED }
}
