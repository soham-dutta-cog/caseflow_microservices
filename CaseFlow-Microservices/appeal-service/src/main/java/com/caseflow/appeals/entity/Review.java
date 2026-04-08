package com.caseflow.appeals.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "reviews") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "review_id") private Long reviewId;
    @Column(name = "case_id", nullable = false) private Long caseId;
    @Column(name = "appeal_id", nullable = false) private Long appealId;
    @Column(name = "judge_id", nullable = false) private Long judgeId;
    @Column(name = "review_date", nullable = false) private LocalDate reviewDate;
    @Enumerated(EnumType.STRING) @Column(length = 30) private ReviewOutcome outcome;
    @Column(columnDefinition = "TEXT") private String remarks;
    public enum ReviewOutcome { APPEAL_UPHELD, APPEAL_DISMISSED, PARTIALLY_UPHELD, REMANDED, RETRIAL_ORDERED }
}
