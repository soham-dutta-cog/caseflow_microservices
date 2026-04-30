package com.caseflow.hearing.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class HearingRequest {
    @NotNull private Long caseId;
    @NotNull private String judgeId;
    @NotNull @FutureOrPresent private LocalDate hearingDate;
    @NotBlank private String hearingTime;
    @NotNull private Long scheduledBy;
    @NotNull private Long scheduleId;
}
