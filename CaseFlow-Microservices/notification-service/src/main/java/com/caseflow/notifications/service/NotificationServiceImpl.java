package com.caseflow.notifications.service;

import com.caseflow.notifications.dto.*;
import com.caseflow.notifications.entity.Notification;
import com.caseflow.notifications.enums.*;
import com.caseflow.notifications.exception.*;
import com.caseflow.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor @Slf4j @Transactional
public class NotificationServiceImpl {
    private final NotificationRepository notificationRepository;

    public NotificationResponse createNotification(NotificationRequest request) {
        Notification n = Notification.builder().userId(request.getUserId()).caseId(request.getCaseId())
            .message(request.getMessage()).category(request.getCategory())
            .status(NotificationStatus.UNREAD).createdDate(LocalDateTime.now()).build();
        n = notificationRepository.save(n);
        log.info("Notification created: id={}, userId={}", n.getNotificationId(), n.getUserId());
        return toResponse(n);
    }

    public NotificationResponse createFromInternal(Map<String, Object> request) {
        NotificationRequest req = new NotificationRequest();
        req.setUserId(Long.valueOf(request.get("userId").toString()));
        if (request.get("caseId") != null) req.setCaseId(Long.valueOf(request.get("caseId").toString()));
        req.setMessage(request.get("message").toString());
        req.setCategory(NotificationCategory.valueOf(request.get("category").toString()));
        return createNotification(req);
    }

    public NotificationResponse markAsRead(Long id) {
        Notification n = findOrThrow(id);
        n.setStatus(NotificationStatus.READ);
        return toResponse(notificationRepository.save(n));
    }

    public void markAllAsReadForUser(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        unread.forEach(n -> n.setStatus(NotificationStatus.READ));
        notificationRepository.saveAll(unread);
    }

    @Transactional(readOnly = true) public NotificationResponse getById(Long id) { return toResponse(findOrThrow(id)); }
    @Transactional(readOnly = true) public List<NotificationResponse> getByUser(Long id) { return notificationRepository.findByUserId(id).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true) public List<NotificationResponse> getByUserAndStatus(Long id, NotificationStatus s) { return notificationRepository.findByUserIdAndStatus(id, s).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true) public List<NotificationResponse> getByCase(Long id) { return notificationRepository.findByCaseId(id).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true) public long countUnreadForUser(Long id) { return notificationRepository.countByUserIdAndStatus(id, NotificationStatus.UNREAD); }

    private Notification findOrThrow(Long id) {
        return notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found: #" + id));
    }
    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder().notificationId(n.getNotificationId()).userId(n.getUserId())
            .caseId(n.getCaseId()).message(n.getMessage()).category(n.getCategory())
            .status(n.getStatus()).createdDate(n.getCreatedDate()).build();
    }
}
