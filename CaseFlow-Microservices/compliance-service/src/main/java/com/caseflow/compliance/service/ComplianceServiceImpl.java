package com.caseflow.compliance.service;

import com.caseflow.compliance.dto.*;
import com.caseflow.compliance.entity.*;
import com.caseflow.compliance.entity.Audit.AuditStatus;
import com.caseflow.compliance.entity.ComplianceRecord.*;
import com.caseflow.compliance.exception.*;
import com.caseflow.compliance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j @Transactional
public class ComplianceServiceImpl {
    private final ComplianceRecordRepository complianceRecordRepository;
    private final AuditRepository auditRepository;

    public List<ComplianceRecordResponse> getComplianceRecordsByCase(Long caseId) {
        return complianceRecordRepository.findByCaseId(caseId).stream().map(this::toComplianceResponse).collect(Collectors.toList());
    }

    public AuditResponse createAudit(AuditRequest request) {
        Audit audit = Audit.builder().adminId(request.getAdminId()).scope(request.getScope())
            .findings(request.getFindings()).date(LocalDate.now()).status(AuditStatus.OPEN).build();
        return toAuditResponse(auditRepository.save(audit));
    }

    public AuditResponse updateFindings(Long auditId, String findings) {
        Audit audit = findAuditOrThrow(auditId);
        if (audit.getStatus() == AuditStatus.CLOSED)
            throw new InvalidOperationException("Cannot update a CLOSED audit");
        audit.setFindings(findings);
        return toAuditResponse(auditRepository.save(audit));
    }

    public AuditResponse closeAudit(Long auditId, Long adminId) {
        Audit audit = findAuditOrThrow(auditId);
        audit.setStatus(AuditStatus.CLOSED); audit.setDate(LocalDate.now());
        return toAuditResponse(auditRepository.save(audit));
    }

    @Transactional(readOnly = true) public AuditResponse getAuditById(Long id) { return toAuditResponse(findAuditOrThrow(id)); }
    @Transactional(readOnly = true) public List<AuditResponse> getAuditsByAdmin(Long id) {
        return auditRepository.findByAdminId(id).stream().map(this::toAuditResponse).collect(Collectors.toList());
    }

    private Audit findAuditOrThrow(Long id) {
        return auditRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Audit not found: #" + id));
    }
    private ComplianceRecordResponse toComplianceResponse(ComplianceRecord r) {
        return ComplianceRecordResponse.builder().complianceId(r.getComplianceId()).caseId(r.getCaseId())
            .type(r.getType()).result(r.getResult()).date(r.getDate()).notes(r.getNotes()).build();
    }
    private AuditResponse toAuditResponse(Audit a) {
        return AuditResponse.builder().auditId(a.getAuditId()).adminId(a.getAdminId())
            .scope(a.getScope()).findings(a.getFindings()).date(a.getDate()).status(a.getStatus()).build();
    }
}
