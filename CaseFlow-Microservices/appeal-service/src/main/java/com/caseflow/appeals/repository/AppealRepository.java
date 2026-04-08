package com.caseflow.appeals.repository;
import com.caseflow.appeals.entity.Appeal;
import com.caseflow.appeals.entity.Appeal.AppealStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppealRepository extends JpaRepository<Appeal, Long> {
    List<Appeal> findByCaseId(Long caseId);
    List<Appeal> findByFiledByUserId(Long userId);
    List<Appeal> findByStatus(AppealStatus status);
    boolean existsByCaseIdAndStatus(Long caseId, AppealStatus status);
}
