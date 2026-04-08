package com.caseflow.notifications.dto;
import com.caseflow.notifications.enums.NotificationCategory;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class NotificationRequest {
    @NotNull private Long userId;
    private Long caseId;
    @NotBlank private String message;
    @NotNull private NotificationCategory category;
}
