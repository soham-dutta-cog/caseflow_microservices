package com.caseflow.hearing.client.fallback;

import com.caseflow.hearing.client.CaseServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component @Slf4j
public class CaseServiceFallback implements CaseServiceClient {

    @Override
    public void updateCaseStatusInternal(Long caseId, String newStatus) {
        log.warn("CIRCUIT BREAKER: case-service unavailable — updateCaseStatus({}, {}) skipped", caseId, newStatus);
    }
}
