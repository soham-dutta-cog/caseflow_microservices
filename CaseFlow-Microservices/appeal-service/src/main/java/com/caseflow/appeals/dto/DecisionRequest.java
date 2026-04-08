package com.caseflow.appeals.dto;
import com.caseflow.appeals.entity.Review.ReviewOutcome;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data
public class DecisionRequest {
    @NotNull private ReviewOutcome outcome;
    private String remarks;
}
