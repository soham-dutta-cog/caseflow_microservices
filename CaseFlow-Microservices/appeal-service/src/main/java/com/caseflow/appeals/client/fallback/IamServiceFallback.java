package com.caseflow.appeals.client.fallback;

import com.caseflow.appeals.client.IamServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class IamServiceFallback implements FallbackFactory<IamServiceClient> {

    @Override
    public IamServiceClient create(Throwable cause) {
        return new IamServiceClient() {
            @Override
            public Boolean existsById(String id) {
                log.warn("CIRCUIT BREAKER [existsById]: iam-service unavailable for user [{}] — cause: {}",
                    id, cause != null ? cause.getMessage() : "Unknown error");
                return null;
            }

            @Override
            public String getUserRole(String id) {
                log.warn("CIRCUIT BREAKER [getUserRole]: iam-service unavailable for user [{}] — cause: {}",
                    id, cause != null ? cause.getMessage() : "Unknown error");
                return null;
            }
        };
    }
}
