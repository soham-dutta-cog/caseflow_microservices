package com.caseflow.appeals.client;

import com.caseflow.appeals.client.fallback.IamServiceFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for inter-service communication with iam-service.
 * Used to validate user existence and roles before sensitive operations
 * (e.g. assigning a judge to an appeal review).
 */
@FeignClient(name = "iam-service", fallbackFactory = IamServiceFallback.class)
public interface IamServiceClient {

    @GetMapping("/api/users/exists/{id}")
    Boolean existsById(@PathVariable("id") String id);

    @GetMapping("/api/users/{id}/role")
    String getUserRole(@PathVariable("id") String id);
}
