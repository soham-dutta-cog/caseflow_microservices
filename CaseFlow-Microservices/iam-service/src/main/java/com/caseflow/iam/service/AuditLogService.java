package com.caseflow.iam.service;

import com.caseflow.iam.entity.AuditLog;
import com.caseflow.iam.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public void log(Long userId, String action, String resource) {
        auditLogRepository.save(AuditLog.builder()
            .userId(userId).action(action).resource(resource)
            .timestamp(LocalDateTime.now()).build());
    }

    public List<AuditLog> getLogsByUser(Long userId) { return auditLogRepository.findByUserId(userId); }
    public List<AuditLog> getAllLogs() { return auditLogRepository.findAll(); }
}
