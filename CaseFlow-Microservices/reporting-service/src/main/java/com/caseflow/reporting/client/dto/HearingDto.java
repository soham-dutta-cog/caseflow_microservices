package com.caseflow.reporting.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDate;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HearingDto {
    private Long hearingId;
    private Long caseId;
    private Long judgeId;
    private String status;          // SCHEDULED, RESCHEDULED, COMPLETED, CANCELLED
    private LocalDate hearingDate;
}
