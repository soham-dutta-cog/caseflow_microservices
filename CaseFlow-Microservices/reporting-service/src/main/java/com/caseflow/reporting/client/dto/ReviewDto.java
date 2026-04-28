package com.caseflow.reporting.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDate;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReviewDto {
    private Long reviewId;
    private Long appealId;
    private Long caseId;
    private Long judgeId;
    private String outcome;       // UPHELD, REVERSED, MODIFIED, SENT_BACK
    private LocalDate reviewDate;
}
