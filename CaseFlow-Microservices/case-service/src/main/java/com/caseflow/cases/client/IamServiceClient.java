package com.caseflow.cases.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "iam-service")
public interface IamServiceClient {
    @GetMapping("/api/users/exists/{id}")
    Boolean existsById(@PathVariable("id") Long id);

    @GetMapping("/api/users/{id}/role")
    String getUserRole(@PathVariable("id") Long id);
}
