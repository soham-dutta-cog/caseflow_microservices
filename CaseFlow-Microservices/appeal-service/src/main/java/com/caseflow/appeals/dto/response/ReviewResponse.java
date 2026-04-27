package com.caseflow.appeals.dto.response;

import com.caseflow.appeals.entity.Review.ReviewOutcome;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * Response DTO returned for all review read/write operations.
 */
@Data
@Builder
public class ReviewResponse {
    private Long          reviewId;
    private Long          caseId;
    private Long          appealId;
    private String        judgeId;
    private LocalDate     reviewDate;
    private ReviewOutcome outcome;
    private String        remarks;
}
