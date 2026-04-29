package com.caseflow.compliance.service;

import com.caseflow.compliance.client.CaseServiceClient;
import com.caseflow.compliance.client.NotificationServiceClient;
import com.caseflow.compliance.client.WorkflowServiceClient;
import com.caseflow.compliance.client.dto.CaseDto;
import com.caseflow.compliance.client.dto.DocumentDto;
import com.caseflow.compliance.client.dto.NotificationRequest;
import com.caseflow.compliance.client.dto.SLARecordDto;
import com.caseflow.compliance.dto.AuditRequest;
import com.caseflow.compliance.dto.AuditResponse;
import com.caseflow.compliance.dto.ComplianceCheckRequest;
import com.caseflow.compliance.dto.ComplianceRecordResponse;
import com.caseflow.compliance.entity.Audit;
import com.caseflow.compliance.entity.Audit.AuditStatus;
import com.caseflow.compliance.entity.ComplianceRecord;
import com.caseflow.compliance.entity.ComplianceRecord.ComplianceResult;
import com.caseflow.compliance.entity.ComplianceRecord.ComplianceType;
import com.caseflow.compliance.exception.BadRequestException;
import com.caseflow.compliance.exception.InvalidOperationException;
import com.caseflow.compliance.exception.ResourceNotFoundException;
import com.caseflow.compliance.repository.AuditRepository;
import com.caseflow.compliance.repository.ComplianceRecordRepository;
import com.caseflow.compliance.security.RoleGuard;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ComplianceServiceImpl implements ComplianceService {

    private final ComplianceRecordRepository complianceRecordRepository;
    private final AuditRepository auditRepository;
    private final CaseServiceClient caseServiceClient;
    private final WorkflowServiceClient workflowServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final RoleGuard roleGuard;

    @Override
    @CircuitBreaker(name = "complianceCheck", fallbackMethod = "runComplianceCheckFallback")
    public List<ComplianceRecordResponse> runComplianceCheck(ComplianceCheckRequest request, String userId) {
        roleGuard.requireUserId(userId);

        List<Long> caseIds = request.getCaseIds();
        if (caseIds == null || caseIds.isEmpty()) {
            caseIds = caseServiceClient.getAllCases().stream()
                    .map(CaseDto::getCaseId)
                    .collect(Collectors.toList());
        }

        // FIX: guard against empty case list — could mean case-service is down or simply no cases exist
        if (caseIds.isEmpty()) {
            log.warn("Compliance check by admin {} found no cases to process — case-service may be unavailable", userId);
            return List.of();
        }

        List<ComplianceRecord> results = new ArrayList<>();

        for (Long caseId : caseIds) {
            List<DocumentDto> docs = caseServiceClient.getDocumentsByCase(caseId);
            long total    = docs.size();
            long verified = docs.stream()
                    .filter(d -> "VERIFIED".equalsIgnoreCase(d.getVerificationStatus()))
                    .count();
            boolean docsOk = total > 0 && total == verified;

            // FIX: explicit note when case has zero documents vs partial verification
            String docNotes;
            if (total == 0) {
                docNotes = "No documents found — document compliance cannot be verified";
            } else if (docsOk) {
                docNotes = "All " + total + " document(s) verified";
            } else {
                docNotes = (total - verified) + " of " + total + " document(s) unverified";
            }

            results.add(complianceRecordRepository.save(ComplianceRecord.builder()
                    .caseId(caseId)
                    .type(ComplianceType.DOCUMENT)
                    .result(docsOk ? ComplianceResult.PASS : ComplianceResult.FAIL)
                    .date(LocalDate.now())
                    .notes(docNotes)
                    .build()));

            List<SLARecordDto> slaRecords = workflowServiceClient.getSlaRecordsByCase(caseId);
            long breached = slaRecords.stream()
                    .filter(s -> "BREACHED".equalsIgnoreCase(s.getStatus()))
                    .count();
            boolean slaOk = breached == 0;

            String slaNotes = slaRecords.isEmpty()
                    ? "No active SLA stages found"
                    : slaOk
                        ? "All " + slaRecords.size() + " SLA stage(s) completed on time"
                        : breached + " of " + slaRecords.size() + " SLA stage(s) breached";

            results.add(complianceRecordRepository.save(ComplianceRecord.builder()
                    .caseId(caseId)
                    .type(ComplianceType.PROCESS)
                    .result(slaOk ? ComplianceResult.PASS : ComplianceResult.FAIL)
                    .date(LocalDate.now())
                    .notes(slaNotes)
                    .build()));

            if (!docsOk || !slaOk) {
                sendNotification(userId, caseId,
                        "Compliance failure for Case #" + caseId
                        + (!docsOk ? " [DOCUMENT: " + docNotes + "]" : "")
                        + (!slaOk  ? " [PROCESS: " + breached + " SLA breach(es)]" : ""));
            }
        }

        long failures = results.stream().filter(r -> r.getResult() == ComplianceResult.FAIL).count();
        log.info("Compliance check by admin {} — {} cases checked, {} check(s) failed",
                userId, caseIds.size(), failures);

        return results.stream().map(this::toComplianceResponse).collect(Collectors.toList());
    }

    public List<ComplianceRecordResponse> runComplianceCheckFallback(
            ComplianceCheckRequest request, String userId, Exception ex) {
        log.error("Compliance check circuit open for admin {} — downstream service unavailable: {}",
                userId, ex.getMessage());
        throw new BadRequestException(
                "Compliance check temporarily unavailable — one or more dependent services are down. Please try again later.");
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "compliance-by-case", key = "#caseId")
    public List<ComplianceRecordResponse> getComplianceRecordsByCase(Long caseId) {
        return complianceRecordRepository.findByCaseId(caseId).stream()
                .map(this::toComplianceResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "audits-by-admin", allEntries = true)
    public AuditResponse createAudit(AuditRequest request, String userId) {
        roleGuard.requireUserId(userId);
        Audit audit = Audit.builder()
                .adminId(userId)
                .scope(request.getScope())
                .findings(request.getFindings())
                .date(LocalDate.now())
                .status(AuditStatus.OPEN)
                .build();
        return toAuditResponse(auditRepository.save(audit));
    }

    @Override
    // FIX: also evict audits-by-admin since it caches AuditResponse which includes findings
    @Caching(evict = {
            @CacheEvict(value = "audits-by-id",    key = "#auditId"),
            @CacheEvict(value = "audits-by-admin", allEntries = true)
    })
    public AuditResponse updateFindings(Long auditId, String findings) {
        // FIX: validate findings before persisting
        if (findings == null || findings.isBlank()) {
            throw new BadRequestException("Findings cannot be blank");
        }
        Audit audit = findAuditOrThrow(auditId);
        if (audit.getStatus() == AuditStatus.CLOSED) {
            throw new InvalidOperationException("Cannot update a CLOSED audit #" + auditId);
        }
        audit.setFindings(findings.strip());
        return toAuditResponse(auditRepository.save(audit));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "audits-by-id",    key = "#auditId"),
            @CacheEvict(value = "audits-by-admin", allEntries = true)
    })
    public AuditResponse closeAudit(Long auditId, String userId) {
        roleGuard.requireUserId(userId);
        Audit audit = findAuditOrThrow(auditId);
        if (audit.getStatus() == AuditStatus.CLOSED) {
            throw new InvalidOperationException("Audit #" + auditId + " is already closed");
        }
        // FIX: findings must be documented before an audit can be closed
        if (audit.getFindings() == null || audit.getFindings().isBlank()) {
            throw new InvalidOperationException(
                    "Audit #" + auditId + " cannot be closed without findings. Use PATCH /api/audits/" + auditId + "/findings first.");
        }
        audit.setStatus(AuditStatus.CLOSED);
        audit.setDate(LocalDate.now());
        Audit saved = auditRepository.save(audit);
        sendNotification(userId, null,
                "Audit #" + auditId + " has been closed. Scope: " + audit.getScope());
        return toAuditResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "audits-by-id", key = "#id")
    public AuditResponse getAuditById(Long id) {
        return toAuditResponse(findAuditOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "audits-by-admin", key = "#adminId")
    public List<AuditResponse> getAuditsByAdmin(String adminId) {
        return auditRepository.findByAdminId(adminId).stream()
                .map(this::toAuditResponse)
                .collect(Collectors.toList());
    }

    private void sendNotification(String userId, Long caseId, String message) {
        try {
            notificationServiceClient.createNotification(
                    new NotificationRequest(userId, caseId, message, "COMPLIANCE"));
        } catch (Exception e) {
            log.warn("Notification delivery failed (non-critical): {}", e.getMessage());
        }
    }

    private Audit findAuditOrThrow(Long id) {
        return auditRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit not found: #" + id));
    }

    private ComplianceRecordResponse toComplianceResponse(ComplianceRecord r) {
        return ComplianceRecordResponse.builder()
                .complianceId(r.getComplianceId())
                .caseId(r.getCaseId())
                .type(r.getType())
                .result(r.getResult())
                .date(r.getDate())
                .notes(r.getNotes())
                .build();
    }

    private AuditResponse toAuditResponse(Audit a) {
        return AuditResponse.builder()
                .auditId(a.getAuditId())
                .adminId(a.getAdminId())
                .scope(a.getScope())
                .findings(a.getFindings())
                .date(a.getDate())
                .status(a.getStatus())
                .build();
    }
}
