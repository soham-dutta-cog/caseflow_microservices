package com.caseflow.hearing.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "schedules") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Schedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long scheduleId;
    @Column(nullable = false) private String judgeId;
    @Column(nullable = false) private LocalDate scheduleDate;
    @Column(nullable = false) private String timeSlot;
    @Column(nullable = false) private Boolean available;
    private Long hearingId;
}
