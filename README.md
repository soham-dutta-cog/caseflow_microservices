# CaseFlow Microservices Architecture

## Services & Ports

| Service               | Port | Database               |
|-----------------------|------|------------------------|
| Eureka Server         | 8761 | -                      |
| API Gateway           | 8085 | -                      |
| IAM Service           | 8081 | caseflow_iam_db        |
| Case Service          | 8082 | caseflow_case_db       |
| Hearing Service       | 8083 | caseflow_hearing_db    |
| Workflow Service      | 8084 | caseflow_workflow_db   |
| Appeal Service        | 8086 | caseflow_appeal_db     |
| Compliance Service    | 8087 | caseflow_compliance_db |
| Notification Service  | 8088 | caseflow_notification_db |
| Reporting Service     | 8089 | caseflow_reporting_db  |

## Startup Order

1. **Eureka Server** (8761) — Service registry
2. **API Gateway** (8085) — Routes all `/api/**` to services
3. **IAM Service** (8081) — Auth & user management (start first among business services)
4. **All other services** — Can be started in any order

## How to Run

```bash
# From root directory
# 1. Start Eureka
cd eureka-server && mvn spring-boot:run

# 2. Start API Gateway
cd api-gateway && mvn spring-boot:run

# 3. Start IAM Service
cd iam-service && mvn spring-boot:run

# 4. Start remaining services (any order)
cd case-service && mvn spring-boot:run
cd hearing-service && mvn spring-boot:run
cd workflow-service && mvn spring-boot:run
cd appeal-service && mvn spring-boot:run
cd compliance-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd reporting-service && mvn spring-boot:run
```

## Inter-Service Communication

Services communicate via **OpenFeign** clients through the **Eureka** service registry.

- All services register with Eureka at `http://localhost:8761/eureka/`
- The API Gateway routes requests using `lb://service-name`
- Each service has its own MySQL database (auto-created)
- Feign clients use logical service names (e.g., `@FeignClient(name = "iam-service")`)

## Swagger UI

Each service has its own Swagger UI:
- IAM: http://localhost:8081/swagger-ui.html
- Cases: http://localhost:8082/swagger-ui.html
- Hearings: http://localhost:8083/swagger-ui.html
- Workflow: http://localhost:8084/swagger-ui.html
- Appeals: http://localhost:8086/swagger-ui.html
- Compliance: http://localhost:8087/swagger-ui.html
- Notifications: http://localhost:8088/swagger-ui.html
- Reporting: http://localhost:8089/swagger-ui.html

## Test Cases

Each service has its own unit tests using JUnit 5 + Mockito.
Run tests: `mvn test` from any service directory.

## MySQL Configuration

Default credentials in all services:
- Username: `*****`
- Password: `*****`

Update `application.yml` in each service to change database credentials.
