package com.caseflow.appeals.repository;
import com.caseflow.appeals.entity.Review;
import com.caseflow.appeals.entity.Review.ReviewOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByAppealId(Long appealId);
    List<Review> findByCaseId(Long caseId);
    List<Review> findByJudgeId(Long judgeId);
    long countByOutcome(ReviewOutcome outcome);
    boolean existsByCaseIdAndJudgeId(Long caseId, Long judgeId);
}
