package com.caseflow.appeals.controller;

import com.caseflow.appeals.dto.*;
import com.caseflow.appeals.entity.Appeal.AppealStatus;
import com.caseflow.appeals.service.AppealService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/appeals") @RequiredArgsConstructor
@Tag(name = "Appeal & Review", description = "Appeal filing, review assignment, decisions")
public class AppealController {
    private final AppealService appealService;

    @PostMapping public ResponseEntity<AppealResponse> fileAppeal(@Valid @RequestBody AppealRequest request) { return ResponseEntity.status(HttpStatus.CREATED).body(appealService.fileAppeal(request)); }
    @GetMapping("/{id}") public ResponseEntity<AppealResponse> getAppeal(@PathVariable Long id) { return ResponseEntity.ok(appealService.getAppealById(id)); }
    @GetMapping("/case/{caseId}") public ResponseEntity<List<AppealResponse>> getAppealsByCase(@PathVariable Long caseId) { return ResponseEntity.ok(appealService.getAppealsByCase(caseId)); }
    @GetMapping("/user/{userId}") public ResponseEntity<List<AppealResponse>> getAppealsByUser(@PathVariable Long userId) { return ResponseEntity.ok(appealService.getAppealsByUser(userId)); }
    @GetMapping("/status/{status}") public ResponseEntity<List<AppealResponse>> getAppealsByStatus(@PathVariable AppealStatus status) { return ResponseEntity.ok(appealService.getAppealsByStatus(status)); }
    @PostMapping("/{id}/review") public ResponseEntity<ReviewResponse> openForReview(@PathVariable Long id, @RequestParam Long judgeId) { return ResponseEntity.ok(appealService.openForReview(id, judgeId)); }
    @GetMapping("/{id}/review") public ResponseEntity<ReviewResponse> getReviewByAppeal(@PathVariable Long id) { return ResponseEntity.ok(appealService.getReviewByAppeal(id)); }
    @PostMapping("/{id}/decide") public ResponseEntity<ReviewResponse> issueDecision(@PathVariable Long id, @RequestParam Long judgeId, @Valid @RequestBody DecisionRequest request) { return ResponseEntity.ok(appealService.issueDecision(id, judgeId, request)); }
    @GetMapping("/reviews/case/{caseId}") public ResponseEntity<List<ReviewResponse>> getReviewsByCase(@PathVariable Long caseId) { return ResponseEntity.ok(appealService.getReviewsByCase(caseId)); }
    @GetMapping("/reviews/judge/{judgeId}") public ResponseEntity<List<ReviewResponse>> getReviewsByJudge(@PathVariable Long judgeId) { return ResponseEntity.ok(appealService.getReviewsByJudge(judgeId)); }
    @PatchMapping("/reviews/{reviewId}/outcome") public ResponseEntity<ReviewResponse> updateReviewOutcome(@PathVariable Long reviewId, @Valid @RequestBody UpdateOutcomeRequest request) { return ResponseEntity.ok(appealService.updateReviewOutcome(reviewId, request.getOutcome())); }
}
