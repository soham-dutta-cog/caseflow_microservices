package com.caseflow.appeals.dto;
import com.caseflow.appeals.entity.Review.ReviewOutcome;
import lombok.*;
import java.time.LocalDate;
@Data @Builder
public class ReviewResponse {
    private Long reviewId; private Long caseId; private Long appealId;
    private Long judgeId; private LocalDate reviewDate;
    private ReviewOutcome outcome; private String remarks;
}
