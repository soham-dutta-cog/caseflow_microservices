package com.caseflow.notifications.repository;
import com.caseflow.notifications.entity.Notification;
import com.caseflow.notifications.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
    List<Notification> findByCaseId(Long caseId);
    long countByUserIdAndStatus(Long userId, NotificationStatus status);
}
