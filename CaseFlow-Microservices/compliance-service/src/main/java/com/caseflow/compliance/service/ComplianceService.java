package com.caseflow.compliance.service;

import com.caseflow.compliance.dto.AuditRequest;
import com.caseflow.compliance.dto.AuditResponse;
import com.caseflow.compliance.dto.ComplianceCheckRequest;
import com.caseflow.compliance.dto.ComplianceRecordResponse;

import java.util.List;

public interface ComplianceService {

    List<ComplianceRecordResponse> runComplianceCheck(ComplianceCheckRequest request, String userId);

    List<ComplianceRecordResponse> getComplianceRecordsByCase(Long caseId);

    AuditResponse createAudit(AuditRequest request, String userId);

    AuditResponse updateFindings(Long auditId, String findings);

    AuditResponse closeAudit(Long auditId, String userId);

    AuditResponse getAuditById(Long auditId);

    List<AuditResponse> getAuditsByAdmin(String adminId);
}
