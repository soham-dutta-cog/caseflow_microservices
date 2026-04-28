package com.caseflow.appeals.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "appeals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appealId;

    @Column(nullable = false)
    private Long caseId;

    @Column(nullable = false, length = 50)
    private String filedByUserId;

    @Column(nullable = false)
    private LocalDate filedDate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppealStatus status;

    public enum AppealStatus {SUBMITTED, REVIEWED, DECIDED, CANCELLED}
}
