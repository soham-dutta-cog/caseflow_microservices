package com.caseflow.hearing.dto;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ScheduleResponse {
    private Long scheduleId; private Long judgeId;
    private LocalDate scheduleDate; private String timeSlot;
    private Boolean available; private Long hearingId;
}
