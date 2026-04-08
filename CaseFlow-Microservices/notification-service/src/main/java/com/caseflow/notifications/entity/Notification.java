package com.caseflow.notifications.entity;
import com.caseflow.notifications.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "notifications") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long notificationId;
    @Column private Long caseId;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, columnDefinition = "TEXT") private String message;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private NotificationCategory category;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) @Builder.Default private NotificationStatus status = NotificationStatus.UNREAD;
    @Column(nullable = false) @Builder.Default private LocalDateTime createdDate = LocalDateTime.now();
}
