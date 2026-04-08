package com.caseflow.notifications.dto;
import com.caseflow.notifications.enums.*;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder
public class NotificationResponse {
    private Long notificationId; private Long userId; private Long caseId;
    private String message; private NotificationCategory category;
    private NotificationStatus status; private LocalDateTime createdDate;
}
