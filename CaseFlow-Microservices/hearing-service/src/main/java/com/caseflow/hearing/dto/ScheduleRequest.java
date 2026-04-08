package com.caseflow.hearing.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ScheduleRequest {
    @NotNull private Long judgeId;
    @NotNull @FutureOrPresent private LocalDate scheduleDate;
    @NotBlank private String timeSlot;
}
