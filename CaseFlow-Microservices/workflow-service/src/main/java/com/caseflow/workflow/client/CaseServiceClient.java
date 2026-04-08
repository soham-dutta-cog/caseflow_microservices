package com.caseflow.workflow.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "case-service")
public interface CaseServiceClient {
    @PatchMapping("/api/cases/internal/{caseId}/type")
    void setCaseType(@PathVariable("caseId") Long caseId, @RequestParam("caseType") String caseType);
}
