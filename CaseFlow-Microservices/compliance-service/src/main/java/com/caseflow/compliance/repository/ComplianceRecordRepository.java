package com.caseflow.compliance.repository;
import com.caseflow.compliance.entity.ComplianceRecord;
import com.caseflow.compliance.entity.ComplianceRecord.ComplianceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplianceRecordRepository extends JpaRepository<ComplianceRecord, Long> {
    List<ComplianceRecord> findByCaseId(Long caseId);
    long countByResult(ComplianceResult result);
}
