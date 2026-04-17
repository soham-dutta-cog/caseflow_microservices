# CaseFlow Microservices 🏛️

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2023.0.1-blue)](https://spring.io/projects/spring-cloud)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A robust microservices architecture for case management systems, built with Spring Boot and Spring Cloud. This project provides a scalable, resilient platform for handling legal cases, appeals, hearings, workflows, compliance, notifications, and reporting.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Services Overview](#services-overview)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Configuration](#database-configuration)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Microservices Architecture**: Modular design with independent services for scalability and maintainability.
- **Service Discovery**: Eureka Server for automatic service registration and discovery.
- **API Gateway**: Centralized routing and load balancing with Spring Cloud Gateway.
- **Centralized Configuration**: Config Server for managing application configurations.
- **Inter-Service Communication**: OpenFeign clients for seamless service-to-service calls.
- **Database Isolation**: Each service has its own MySQL database.
- **API Documentation**: Swagger UI for interactive API exploration.
- **Security**: IAM Service for authentication and authorization.
- **Comprehensive Testing**: Unit tests with JUnit 5 and Mockito.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Config Server  │    │  Eureka Server  │
│     (8085)      │    │                 │    │     (8761)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                   │
         └────────────────────────┼───────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼─────────┐ ┌─▼─────────┐ ┌─▼─────────┐
          │   IAM Service    │ │Case Service│ │Hearing   │
          │     (8081)       │ │  (8082)    │ │Service   │
          └─────────────────┘ └────────────┘ │ (8083)    │
                                             └──────────┘
                    ┌─────────────┐ ┌─────────┐ ┌─────────┐
                    │Workflow     │ │Appeal   │ │Compliance│
                    │Service      │ │Service  │ │Service  │
                    │ (8084)      │ │ (8086)  │ │ (8087)  │
                    └─────────────┘ └─────────┘ └─────────┘
                    ┌─────────────┐ ┌─────────┐
                    │Notification │ │Reporting│
                    │Service      │ │Service  │
                    │ (8088)      │ │ (8089)  │
                    └─────────────┘ └─────────┘
```

## 📦 Services Overview

| Service              | Port | Database                  | Description |
|----------------------|------|---------------------------|-------------|
| **Eureka Server**    | 8761 | -                         | Service registry and discovery |
| **Config Server**    | -    | -                         | Centralized configuration management |
| **API Gateway**      | 8085 | -                         | API routing and load balancing |
| **IAM Service**      | 8081 | `caseflow_iam_db`         | Identity and Access Management |
| **Case Service**     | 8082 | `caseflow_case_db`        | Case management and tracking |
| **Hearing Service**  | 8083 | `caseflow_hearing_db`     | Hearing scheduling and management |
| **Workflow Service** | 8084 | `caseflow_workflow_db`    | Business process workflows |
| **Appeal Service**   | 8086 | `caseflow_appeal_db`      | Appeal handling and processing |
| **Compliance Service**| 8087 | `caseflow_compliance_db`  | Regulatory compliance checks |
| **Notification Service**| 8088 | `caseflow_notification_db`| Notifications and alerts |
| **Reporting Service**| 8089 | `caseflow_reporting_db`  | Analytics and reporting |

## 📋 Prerequisites

- **Java 21** or higher
- **Maven 3.6+**
- **MySQL 8.0+**
- **Git**

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/caseflow-microservices.git
   cd caseflow-microservices
   ```

2. **Set up MySQL databases:**
   Create the following databases in MySQL:
   ```sql
   CREATE DATABASE caseflow_iam_db;
   CREATE DATABASE caseflow_case_db;
   CREATE DATABASE caseflow_hearing_db;
   CREATE DATABASE caseflow_workflow_db;
   CREATE DATABASE caseflow_appeal_db;
   CREATE DATABASE caseflow_compliance_db;
   CREATE DATABASE caseflow_notification_db;
   CREATE DATABASE caseflow_reporting_db;
   ```

3. **Configure database credentials:**
   Update `application.yml` in each service directory if needed. Default credentials:
   - Username: `root`
   - Password: `11222004`

## ▶️ Running the Application

### Startup Order

1. **Eureka Server** (8761) — Service registry
2. **Config Server** — Centralized configuration
3. **API Gateway** (8085) — Routes all `/api/**` to services
4. **IAM Service** (8081) — Auth & user management (start first among business services)
5. **All other services** — Can be started in any order

### Commands

```bash
# From root directory

# 1. Start Eureka Server
cd eureka-server && mvn spring-boot:run

# 2. Start Config Server
cd config-server && mvn spring-boot:run

# 3. Start API Gateway
cd api-gateway && mvn spring-boot:run

# 4. Start IAM Service
cd iam-service && mvn spring-boot:run

# 5. Start remaining services (any order)
cd case-service && mvn spring-boot:run &
cd hearing-service && mvn spring-boot:run &
cd workflow-service && mvn spring-boot:run &
cd appeal-service && mvn spring-boot:run &
cd compliance-service && mvn spring-boot:run &
cd notification-service && mvn spring-boot:run &
cd reporting-service && mvn spring-boot:run &
```

## 📚 API Documentation

Each service provides interactive API documentation via Swagger UI:

- **IAM Service**: http://localhost:8081/swagger-ui.html
- **Case Service**: http://localhost:8082/swagger-ui.html
- **Hearing Service**: http://localhost:8083/swagger-ui.html
- **Workflow Service**: http://localhost:8084/swagger-ui.html
- **Appeal Service**: http://localhost:8086/swagger-ui.html
- **Compliance Service**: http://localhost:8087/swagger-ui.html
- **Notification Service**: http://localhost:8088/swagger-ui.html
- **Reporting Service**: http://localhost:8089/swagger-ui.html

## 🗄️ Database Configuration

### Default MySQL Credentials
- **Host**: localhost
- **Port**: 3306
- **Username**: root
- **Password**: 11222004

### Database Schema
Each service automatically creates its database schema on startup using JPA/Hibernate.

## 🧪 Testing

Run unit tests for all services:
```bash
mvn test
```

Run tests for a specific service:
```bash
cd <service-name> && mvn test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Spring Boot and Spring Cloud**
