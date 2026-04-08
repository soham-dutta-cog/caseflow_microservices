package com.caseflow.appeals.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient(name = "notification-service")
public interface NotificationServiceClient {
    @PostMapping("/api/notifications/internal")
    void sendNotification(@RequestBody Map<String, Object> request);
}
