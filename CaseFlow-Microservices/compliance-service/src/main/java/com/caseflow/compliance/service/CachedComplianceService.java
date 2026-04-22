package com.caseflow.compliance.service;

import com.caseflow.compliance.entity.ComplianceRecord;
import com.caseflow.compliance.entity.Audit;
import com.caseflow.compliance.repository.ComplianceRecordRepository;
import com.caseflow.compliance.repository.AuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CachedComplianceService {

    private final ComplianceRecordRepository complianceRecordRepository;
    private final AuditRepository auditRepository;

    public Page<ComplianceRecord> getAllComplianceRecordsPaginated(Pageable pageable) {
        return complianceRecordRepository.findAll(pageable);
    }

    public Page<Audit> getAllAuditsPaginated(Pageable pageable) {
        return auditRepository.findAll(pageable);
    }
}
