package com.caseflow.workflow.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "sla_records") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SLARecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long slaRecordId;
    @Column(nullable = false) private Long caseId;
    @Column(nullable = false) private Long stageId;
    @Column(nullable = false) private LocalDate startDate;
    private LocalDate endDate;
    @Column(nullable = false) @Enumerated(EnumType.STRING) private SLAStatus status;
    @Column(nullable = false) private Integer slaDays;
    @Column(nullable = false) private Boolean breachNotified;
    public enum SLAStatus { BREACHED, COMPLETED, ON_TIME }
}
