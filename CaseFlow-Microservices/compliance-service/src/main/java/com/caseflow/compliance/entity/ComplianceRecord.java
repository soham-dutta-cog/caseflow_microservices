package com.caseflow.compliance.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "compliance_records") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ComplianceRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long complianceId;
    @Column(nullable = false) private Long caseId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ComplianceType type;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private ComplianceResult result;
    @Column(nullable = false) private LocalDate date;
    @Column(columnDefinition = "TEXT") private String notes;
    public enum ComplianceType { DOCUMENT, PROCESS }
    public enum ComplianceResult { PASS, FAIL }
}
