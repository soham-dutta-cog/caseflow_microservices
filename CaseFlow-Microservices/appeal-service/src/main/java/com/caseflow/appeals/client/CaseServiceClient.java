package com.caseflow.appeals.client;

import com.caseflow.appeals.client.fallback.CaseServiceFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "case-service", fallback = CaseServiceFallback.class)
public interface CaseServiceClient {
    @PatchMapping("/api/cases/internal/{caseId}/status")
    void updateCaseStatusInternal(@PathVariable("caseId") Long caseId, @RequestParam("newStatus") String newStatus);
}
