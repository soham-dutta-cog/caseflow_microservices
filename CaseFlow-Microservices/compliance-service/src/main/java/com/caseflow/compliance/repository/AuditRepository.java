package com.caseflow.compliance.repository;
import com.caseflow.compliance.entity.Audit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditRepository extends JpaRepository<Audit, Long> {
    List<Audit> findByAdminId(Long adminId);
}
