package com.caseflow.appeals.service;

import com.caseflow.appeals.client.*;
import com.caseflow.appeals.dto.*;
import com.caseflow.appeals.entity.*;
import com.caseflow.appeals.entity.Appeal.AppealStatus;
import com.caseflow.appeals.entity.Review.ReviewOutcome;
import com.caseflow.appeals.exception.*;
import com.caseflow.appeals.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j @Transactional
public class AppealService {
    private final AppealRepository appealRepository;
    private final ReviewRepository reviewRepository;
    private final CaseServiceClient caseClient;
    private final WorkflowServiceClient workflowClient;
    private final NotificationServiceClient notificationClient;

    public AppealResponse fileAppeal(AppealRequest request) {
        if (appealRepository.existsByCaseIdAndStatus(request.getCaseId(), AppealStatus.SUBMITTED))
            throw new DuplicateResourceException("A SUBMITTED appeal already exists for case #" + request.getCaseId());
        Appeal appeal = Appeal.builder().caseId(request.getCaseId()).filedByUserId(request.getFiledByUserId())
            .filedDate(LocalDate.now()).reason(request.getReason()).status(AppealStatus.SUBMITTED).build();
        appeal = appealRepository.save(appeal);
        return toAppealResponse(appeal);
    }

    public ReviewResponse openForReview(Long appealId, Long judgeId) {
        Appeal appeal = findAppealOrThrow(appealId);
        if (appeal.getStatus() != AppealStatus.SUBMITTED)
            throw new InvalidOperationException("Appeal not in SUBMITTED state");
        if (reviewRepository.existsByCaseIdAndJudgeId(appeal.getCaseId(), judgeId))
            throw new DuplicateResourceException("Judge already reviewed an appeal for this case");
        appeal.setStatus(AppealStatus.REVIEWED);
        appealRepository.save(appeal);
        Review review = Review.builder().caseId(appeal.getCaseId()).appealId(appealId)
            .judgeId(judgeId).reviewDate(LocalDate.now()).build();
        return toReviewResponse(reviewRepository.save(review));
    }

    public ReviewResponse issueDecision(Long appealId, Long judgeId, DecisionRequest request) {
        Appeal appeal = findAppealOrThrow(appealId);
        if (appeal.getStatus() != AppealStatus.REVIEWED)
            throw new InvalidOperationException("Decision can only be issued on REVIEWED appeal");
        Review review = reviewRepository.findByAppealId(appealId)
            .orElseThrow(() -> new ResourceNotFoundException("No review record for appeal #" + appealId));
        review.setOutcome(request.getOutcome()); review.setRemarks(request.getRemarks());
        review.setJudgeId(judgeId); reviewRepository.save(review);
        appeal.setStatus(AppealStatus.DECIDED); appealRepository.save(appeal);

        try {
            if (request.getOutcome() == ReviewOutcome.APPEAL_UPHELD || request.getOutcome() == ReviewOutcome.RETRIAL_ORDERED) {
                caseClient.updateCaseStatusInternal(appeal.getCaseId(), "ACTIVE");
                workflowClient.advanceWorkflow(appeal.getCaseId());
            } else if (request.getOutcome() == ReviewOutcome.REMANDED) {
                caseClient.updateCaseStatusInternal(appeal.getCaseId(), "FILED");
            }
        } catch (Exception e) { log.warn("Cross-service call failed: {}", e.getMessage()); }
        return toReviewResponse(review);
    }

    @Transactional(readOnly = true) public AppealResponse getAppealById(Long id) { return toAppealResponse(findAppealOrThrow(id)); }
    @Transactional(readOnly = true) public List<AppealResponse> getAppealsByCase(Long id) { return appealRepository.findByCaseId(id).stream().map(this::toAppealResponse).toList(); }
    @Transactional(readOnly = true) public List<AppealResponse> getAppealsByUser(Long id) { return appealRepository.findByFiledByUserId(id).stream().map(this::toAppealResponse).toList(); }
    @Transactional(readOnly = true) public List<AppealResponse> getAppealsByStatus(AppealStatus s) { return appealRepository.findByStatus(s).stream().map(this::toAppealResponse).toList(); }
    @Transactional(readOnly = true) public ReviewResponse getReviewByAppeal(Long id) {
        return toReviewResponse(reviewRepository.findByAppealId(id).orElseThrow(() -> new ResourceNotFoundException("No review for appeal #" + id)));
    }
    @Transactional(readOnly = true) public List<ReviewResponse> getReviewsByCase(Long id) { return reviewRepository.findByCaseId(id).stream().map(this::toReviewResponse).toList(); }
    @Transactional(readOnly = true) public List<ReviewResponse> getReviewsByJudge(Long id) { return reviewRepository.findByJudgeId(id).stream().map(this::toReviewResponse).toList(); }

    public ReviewResponse updateReviewOutcome(Long reviewId, String outcome) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Review not found: #" + reviewId));
        try { review.setOutcome(ReviewOutcome.valueOf(outcome.replace(" ", "_").toUpperCase())); }
        catch (IllegalArgumentException e) { throw new InvalidOperationException("Invalid outcome: " + outcome); }
        return toReviewResponse(reviewRepository.save(review));
    }

    private Appeal findAppealOrThrow(Long id) {
        return appealRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Appeal not found: #" + id));
    }
    private AppealResponse toAppealResponse(Appeal a) {
        return AppealResponse.builder().appealId(a.getAppealId()).caseId(a.getCaseId())
            .filedByUserId(a.getFiledByUserId()).filedDate(a.getFiledDate())
            .reason(a.getReason()).status(a.getStatus()).build();
    }
    private ReviewResponse toReviewResponse(Review r) {
        return ReviewResponse.builder().reviewId(r.getReviewId()).caseId(r.getCaseId())
            .appealId(r.getAppealId()).judgeId(r.getJudgeId()).reviewDate(r.getReviewDate())
            .outcome(r.getOutcome()).remarks(r.getRemarks()).build();
    }
}
