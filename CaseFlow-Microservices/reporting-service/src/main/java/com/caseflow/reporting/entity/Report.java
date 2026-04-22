package com.caseflow.reporting.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "reports") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long reportId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ReportScope scope;
    @Column(nullable = false) private String scopeValue;
    @Column(nullable = false, columnDefinition = "TEXT") private String metrics;
    @Column(nullable = false) private LocalDate generatedDate;
    @Column(nullable = false) private Long requestedBy;
    public enum ReportScope { COURT, JUDGE, PERIOD, CLERK, LAWYER }
}
