package com.caseflow.appeals.service;

import com.caseflow.appeals.client.CaseServiceClient;
import com.caseflow.appeals.client.NotificationServiceClient;
import com.caseflow.appeals.client.WorkflowServiceClient;
import com.caseflow.appeals.dto.request.DecisionRequest;
import com.caseflow.appeals.dto.request.UpdateOutcomeRequest;
import com.caseflow.appeals.dto.response.ReviewResponse;
import com.caseflow.appeals.entity.Appeal;
import com.caseflow.appeals.entity.Appeal.AppealStatus;
import com.caseflow.appeals.entity.Review;
import com.caseflow.appeals.entity.Review.ReviewOutcome;
import com.caseflow.appeals.exception.DuplicateResourceException;
import com.caseflow.appeals.exception.InvalidOperationException;
import com.caseflow.appeals.exception.ResourceNotFoundException;
import com.caseflow.appeals.repository.AppealRepository;
import com.caseflow.appeals.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Handles all review-related business logic:
 * - Assigning a judge and opening a review (SUBMITTED → REVIEWED)
 * - Issuing the final decision           (REVIEWED → DECIDED)
 * - Draft outcome update
 * - All review read operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewService {

    private final AppealRepository  appealRepository;
    private final ReviewRepository  reviewRepository;
    private final CaseServiceClient caseClient;
    private final WorkflowServiceClient  workflowClient;
    private final NotificationServiceClient notificationClient;

    // ─── Open For Review ─────────────────────────────────────────────────────

    /**
     * Assign a judge and transition the appeal SUBMITTED → REVIEWED.
     * The same judge cannot be assigned to two appeals for the same case
     * (conflict-of-interest guard).
     */
    public ReviewResponse openForReview(Long appealId, String judgeId) {
        Appeal appeal = findAppealOrThrow(appealId);

        if (appeal.getStatus() != AppealStatus.SUBMITTED) {
            throw new InvalidOperationException(
                "Appeal #" + appealId + " must be in SUBMITTED state to open for review. " +
                "Current state: " + appeal.getStatus());
        }

        if (reviewRepository.existsByCaseIdAndJudgeId(appeal.getCaseId(), judgeId)) {
            throw new DuplicateResourceException(
                "Judge [" + judgeId + "] has already reviewed an appeal for case #" + appeal.getCaseId()
                + ". Assign a different judge to avoid conflict of interest.");
        }

        appeal.setStatus(AppealStatus.REVIEWED);
        appealRepository.save(appeal);

        Review review = Review.builder()
            .caseId(appeal.getCaseId())
            .appealId(appealId)
            .judgeId(judgeId)
            .reviewDate(LocalDate.now())
            .build();
        review = reviewRepository.save(review);
        log.info("Appeal #{} opened for review. Assigned to judge [{}]", appealId, judgeId);

        // Notify the filer their appeal is now under review
        try {
            notificationClient.sendNotification(Map.of(
                "type",    "APPEAL_UNDER_REVIEW",
                "caseId",  appeal.getCaseId(),
                "userId",  appeal.getFiledByUserId(),
                "judgeId", judgeId,
                "message", "Appeal #" + appealId + " for case #" + appeal.getCaseId()
                           + " is now under review by an assigned judge."
            ));
        } catch (Exception e) {
            log.warn("Failed to send APPEAL_UNDER_REVIEW notification for appeal #{}: {}", appealId, e.getMessage());
        }

        return toReviewResponse(review);
    }

    // ─── Issue Decision ──────────────────────────────────────────────────────

    /**
     * Issue the final decision on a REVIEWED appeal: REVIEWED → DECIDED.
     * Only the originally assigned judge or an ADMIN can decide.
     * Case status is updated via case-service based on the outcome.
     * The DECIDED status is always persisted even if downstream calls fail.
     */
    public ReviewResponse issueDecision(Long appealId, String judgeId,
                                        DecisionRequest request, String userRole) {
        Appeal appeal = findAppealOrThrow(appealId);
        if (appeal.getStatus() != AppealStatus.REVIEWED) {
            throw new InvalidOperationException(
                "Decision can only be issued on a REVIEWED appeal. Current state: " + appeal.getStatus());
        }

        Review review = reviewRepository.findByAppealId(appealId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No review record found for appeal #" + appealId));

        // Only the assigned judge or ADMIN can decide
        if (!"ADMIN".equalsIgnoreCase(userRole) && !judgeId.equals(review.getJudgeId())) {
            throw new InvalidOperationException(
                "Access denied: Only the assigned judge [" + review.getJudgeId() + "] " +
                "or an ADMIN can issue a decision on appeal #" + appealId + ".");
        }

        review.setOutcome(request.getOutcome());
        review.setRemarks(request.getRemarks());
        reviewRepository.save(review);

        appeal.setStatus(AppealStatus.DECIDED);
        appealRepository.save(appeal);

        ReviewOutcome outcome = request.getOutcome();
        log.info("Decision issued for appeal #{} by judge [{}]: outcome={}", appealId, judgeId, outcome);

        // Cross-service case-status update — try-catch ensures DECIDED always persists
        try {
            if (outcome == ReviewOutcome.APPEAL_UPHELD || outcome == ReviewOutcome.RETRIAL_ORDERED) {
                log.info("Updating case #{} status: CLOSED → ACTIVE", appeal.getCaseId());
                Map<String, Object> resp = caseClient.updateCaseStatusInternal(appeal.getCaseId(), "ACTIVE");
                if (resp != null && "FALLBACK".equals(resp.get("status"))) {
                    log.error("FALLBACK: case-service unavailable — case #{} NOT updated to ACTIVE", appeal.getCaseId());
                } else {
                    log.info("Case #{} status updated to ACTIVE successfully", appeal.getCaseId());
                }
                workflowClient.advanceWorkflow(appeal.getCaseId());

            } else if (outcome == ReviewOutcome.REMANDED) {
                log.info("Updating case #{} status: CLOSED → FILED", appeal.getCaseId());
                Map<String, Object> resp = caseClient.updateCaseStatusInternal(appeal.getCaseId(), "FILED");
                if (resp != null && "FALLBACK".equals(resp.get("status"))) {
                    log.error("FALLBACK: case-service unavailable — case #{} NOT updated to FILED", appeal.getCaseId());
                } else {
                    log.info("Case #{} status updated to FILED successfully", appeal.getCaseId());
                }

            } else {
                // APPEAL_DISMISSED / PARTIALLY_UPHELD → case stays CLOSED
                log.info("Outcome {} — case #{} status unchanged (remains CLOSED)", outcome, appeal.getCaseId());
            }
        } catch (Exception e) {
            log.error("DOWNSTREAM FAILURE: could not update case #{} status after decision [{}] on appeal #{}. " +
                      "Appeal is DECIDED. Cause: {}", appeal.getCaseId(), outcome, appealId, e.getMessage());
        }

        // Notify the appeal filer of the outcome
        try {
            notificationClient.sendNotification(Map.of(
                "type",    "APPEAL_DECIDED",
                "caseId",  appeal.getCaseId(),
                "userId",  appeal.getFiledByUserId(),
                "judgeId", judgeId,
                "outcome", outcome.name(),
                "message", "Appeal #" + appealId + " for case #" + appeal.getCaseId()
                           + " has been decided. Outcome: " + outcome.name()
            ));
        } catch (Exception e) {
            log.warn("Failed to send APPEAL_DECIDED notification for appeal #{}: {}", appealId, e.getMessage());
        }

        return toReviewResponse(review);
    }

    // ─── Update Draft Outcome ────────────────────────────────────────────────

    /**
     * Update the draft outcome while the appeal is still REVIEWED.
     * Does NOT transition the appeal to DECIDED — call issueDecision() for that.
     */
    public ReviewResponse updateReviewOutcome(Long reviewId, ReviewOutcome outcome) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found: #" + reviewId));

        Appeal appeal = findAppealOrThrow(review.getAppealId());
        if (appeal.getStatus() != AppealStatus.REVIEWED) {
            throw new InvalidOperationException(
                "Cannot update outcome — appeal #" + review.getAppealId()
                + " is not in REVIEWED state. Current state: " + appeal.getStatus());
        }

        review.setOutcome(outcome);
        return toReviewResponse(reviewRepository.save(review));
    }

    // ─── Read Operations ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReviewResponse getReviewByAppeal(Long appealId) {
        return toReviewResponse(
            reviewRepository.findByAppealId(appealId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "No review found for appeal #" + appealId)));
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByCase(Long caseId) {
        return reviewRepository.findByCaseId(caseId)
            .stream().map(this::toReviewResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByJudge(String judgeId) {
        return reviewRepository.findByJudgeId(judgeId)
            .stream().map(this::toReviewResponse).toList();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Appeal findAppealOrThrow(Long id) {
        return appealRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: #" + id));
    }

    private ReviewResponse toReviewResponse(Review r) {
        return ReviewResponse.builder()
            .reviewId(r.getReviewId())
            .caseId(r.getCaseId())
            .appealId(r.getAppealId())
            .judgeId(r.getJudgeId())
            .reviewDate(r.getReviewDate())
            .outcome(r.getOutcome())
            .remarks(r.getRemarks())
            .build();
    }
}
