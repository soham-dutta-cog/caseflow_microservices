package com.caseflow.notifications.controller;

import com.caseflow.notifications.dto.*;
import com.caseflow.notifications.enums.NotificationStatus;
import com.caseflow.notifications.service.NotificationServiceImpl;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification hub")
public class NotificationController {
    private final NotificationServiceImpl notificationService;

    @PostMapping public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest request) { return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(request)); }
    @PostMapping("/internal") public ResponseEntity<NotificationResponse> createInternalNotification(@RequestBody Map<String, Object> request) { return ResponseEntity.ok(notificationService.createFromInternal(request)); }
    @GetMapping("/{id}") public ResponseEntity<NotificationResponse> getById(@PathVariable Long id) { return ResponseEntity.ok(notificationService.getById(id)); }
    @GetMapping("/user/{userId}") public ResponseEntity<List<NotificationResponse>> getByUser(@PathVariable Long userId) { return ResponseEntity.ok(notificationService.getByUser(userId)); }
    @GetMapping("/user/{userId}/unread") public ResponseEntity<List<NotificationResponse>> getUnread(@PathVariable Long userId) { return ResponseEntity.ok(notificationService.getByUserAndStatus(userId, NotificationStatus.UNREAD)); }
    @GetMapping("/user/{userId}/count") public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long userId) { return ResponseEntity.ok(Map.of("unreadCount", notificationService.countUnreadForUser(userId))); }
    @GetMapping("/case/{caseId}") public ResponseEntity<List<NotificationResponse>> getByCase(@PathVariable Long caseId) { return ResponseEntity.ok(notificationService.getByCase(caseId)); }
    @PatchMapping("/{id}/read") public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) { return ResponseEntity.ok(notificationService.markAsRead(id)); }
    @PatchMapping("/user/{userId}/read-all") public ResponseEntity<Map<String, String>> markAllRead(@PathVariable Long userId) { notificationService.markAllAsReadForUser(userId); return ResponseEntity.ok(Map.of("message", "All notifications marked as read for userId: " + userId)); }
}
