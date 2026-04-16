package com.caseflow.hearing.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "case-service")
public interface CaseServiceClient {
    @PatchMapping("/api/cases/internal/{caseId}/status")
    void updateCaseStatusInternal(@PathVariable("caseId") Long caseId, @RequestParam("newStatus") String newStatus);
}
