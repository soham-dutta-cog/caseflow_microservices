package com.caseflow.workflow.repository;
import com.caseflow.workflow.entity.SLARecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SLARecordRepository extends JpaRepository<SLARecord, Long> {
    List<SLARecord> findByCaseId(Long caseId);
    Optional<SLARecord> findByStageId(Long stageId);
    List<SLARecord> findByStatus(SLARecord.SLAStatus status);
}
