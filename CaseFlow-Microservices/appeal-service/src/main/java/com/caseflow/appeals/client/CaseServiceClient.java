package com.caseflow.appeals.client;

import com.caseflow.appeals.client.fallback.CaseServiceFallback;
import com.caseflow.appeals.dto.response.CaseOwnerInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Feign client for inter-service communication with case-service.
 * 
 * Important: Feign automatically deserializes ResponseEntity<T> responses to the inner type T.
 * So when case-service returns ResponseEntity<CaseResponse>, Feign unmarshals it to 
 * LinkedHashMap (which implements Map<String, Object>).
 * 
 * Fallback is triggered on network errors, timeouts, or circuit breaker open state.
 */
@FeignClient(name = "case-service", fallbackFactory = CaseServiceFallback.class)
public interface CaseServiceClient {

    /**
     * Fetches case ownership info (litigantId, lawyerId, status) in a single call.
     * Returns null from fallback when case-service is unreachable.
     */
    @GetMapping("/api/cases/{caseId}")
    CaseOwnerInfo getCaseDetails(@PathVariable("caseId") Long caseId);

    @GetMapping("/api/cases/internal/{caseId}/status")
    String getCaseStatus(@PathVariable("caseId") Long caseId);

    /**
     * Updates case status via internal endpoint.
     * The newStatus parameter is passed as a query parameter.
     * Example: ACTIVE, CLOSED, FILED, ADJOURNED
     * 
     * Note: 
     * - The status value is converted by Spring to the Case.CaseStatus enum on case-service side.
     * - Feign returns the CaseResponse body (unmarshaled from ResponseEntity<CaseResponse>) as Map
     * - If case-service is down, the fallback is invoked instead
     */
    @PatchMapping("/api/cases/internal/{caseId}/status")
    Map<String, Object> updateCaseStatusInternal(
        @PathVariable("caseId") Long caseId, 
        @RequestParam("newStatus") String newStatus
    );
}

