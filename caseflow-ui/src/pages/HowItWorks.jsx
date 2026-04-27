import { Link } from 'react-router-dom'

/* ───── Case Lifecycle Steps ───── */
const lifecycle = [
  {
    num: '1', title: 'Case Filing & Document Upload', service: 'case-service → iam-service',
    simple: 'A person (litigant) or their lawyer logs in and fills out a form to file a new case. They attach documents like petitions, affidavits, or evidence. The system auto-generates a unique Case ID and sets the status to "FILED".',
    technical: 'The React frontend sends a POST request to /api/cases/file via the API Gateway (:8085). The Gateway validates the JWT token by checking the Authorization header, then routes the request to case-service. The case-service persists the case entity in its dedicated MySQL database with an auto-incremented caseId. Documents are uploaded separately via multipart/form-data POST to /api/cases/documents/upload. Each document is stored with metadata (docType, uploadedBy, verificationStatus=PENDING). The case-service uses OpenFeign to call iam-service internally to validate the litigant and lawyer IDs exist.',
    details: [
      'Supported document types: PETITION, AFFIDAVIT, EVIDENCE, ORDER, JUDGMENT, OTHER',
      'Case types supported: civil, criminal, corporate',
      'Case statuses flow: FILED → UNDER_REVIEW → HEARING_SCHEDULED → DECIDED → APPEALED → CLOSED',
      'Documents start as PENDING and must be VERIFIED by a clerk before the case can proceed',
      'If a document is REJECTED, the litigant can re-upload it',
    ],
  },
  {
    num: '2', title: 'Document Verification', service: 'case-service (clerk action)',
    simple: 'A court clerk reviews the uploaded documents. They can mark each document as "Verified" or "Rejected". Only when ALL documents for a case are verified does the case automatically move from "FILED" to "ACTIVE" status — no manual intervention needed.',
    technical: 'The clerk calls PATCH /api/cases/documents/{docId}/verify with a body containing verificationStatus and remarks. After each verification, the case-service checks if all documents for that case are now VERIFIED. If yes, it automatically updates the case status from FILED to ACTIVE via an internal status transition. This is done within a @Transactional method to ensure atomicity — either both the document verification and case status update succeed, or neither does.',
    details: [
      'Clerks see all pending documents across all cases via GET /api/cases/documents/pending',
      'Each document can be downloaded for review via GET /api/cases/documents/{docId}/download',
      'Verification includes optional remarks explaining the decision',
      'The auto-activation logic uses a count query: if pending_count == 0 then activate',
    ],
  },
  {
    num: '3', title: 'Workflow & SLA Initialization', service: 'workflow-service → case-service',
    simple: 'Once a case becomes active, the Workflow engine kicks in. It creates a set of stages (like "Filing", "Investigation", "Hearing", "Decision") and assigns a deadline (SLA) to each stage. Think of it like a project timeline — each stage has a due date, and the system tracks whether you are on time or late.',
    technical: 'When triggered, the workflow-service calls POST /api/workflow/lifecycle/{caseId}/initialize. This creates WorkflowStage entities for each stage based on the case type (civil/criminal/corporate have different stage templates). Each stage gets an SLA deadline calculated from the current date plus a configured duration. The SLA entities are created with status=ACTIVE. A scheduled job (@Scheduled) runs periodically via POST /api/workflow/sla/check to compare current time against deadlines — if a deadline is approaching, the SLA status moves to WARNING; if passed, it moves to BREACHED. The workflow-service uses OpenFeign to call notification-service to send SLA breach/warning alerts.',
    details: [
      'Lifecycle modes: "auto" (system-defined stages) or "manual" (admin-defined)',
      'SLA statuses: ACTIVE → WARNING → BREACHED → CLOSED',
      'Supports stage operations: advance, rollback, skip, reassign',
      'SLA extensions can be requested with a reason (PATCH /api/workflow/cases/{caseId}/sla/extend)',
      'Each stage tracks: stageName, assignedTo, startDate, dueDate, actualEndDate, status',
      'The breached endpoint (GET /api/workflow/sla/breached) returns all currently breached SLAs across all cases',
    ],
  },
  {
    num: '4', title: 'Hearing Scheduling', service: 'hearing-service → iam-service → notification-service',
    simple: 'A court clerk checks which judges are available, picks a time slot, and schedules a hearing for the case. The system automatically notifies all parties — the judge, lawyer, and litigant — about the hearing date and time. If there is a conflict, the system prevents double-booking.',
    technical: 'The process has two parts. First, judges add their available slots via POST /api/hearings/schedule/slots (providing date, startTime, endTime). Clerks query available slots via GET /api/hearings/schedule/judge/{judgeId}/available. Then the clerk schedules a hearing via POST /api/hearings/schedule with the caseId, judgeId, hearingDate, hearingTime, and slotId. The hearing-service validates no conflict exists for that judge at that time, marks the slot as booked, creates a Hearing entity with status=SCHEDULED, and uses OpenFeign to call notification-service to send notifications to all parties. The hearing-service calls iam-service to resolve the names/emails of the judge, lawyer, and litigant for the notification content.',
    details: [
      'Hearing statuses: SCHEDULED → RESCHEDULED → COMPLETED → CANCELLED',
      'Rescheduling requires a reason (PATCH /api/hearings/{id}/reschedule)',
      'Completion records the outcome and notes (PATCH /api/hearings/{id}/complete)',
      'Supports querying by case, judge, or status for filtering',
      'Judge slot management prevents overlapping bookings',
      'Pagination supported via GET /api/hearings/paginated?page=0&size=10&sort=hearingId,desc',
    ],
  },
  {
    num: '5', title: 'Stage Advancement & SLA Tracking', service: 'workflow-service → notification-service',
    simple: 'As the case progresses (e.g., from "Investigation" to "Hearing" to "Decision"), the workflow engine moves it through stages. At each stage, it checks: are we still on time? If a deadline is about to be missed, it sends a warning. If already missed, it flags it as "breached". Admins can also extend deadlines if there is a valid reason.',
    technical: 'Stage advancement is triggered via POST /api/workflow/cases/{caseId}/advance. The workflow-service finds the current active stage, marks it as COMPLETED with actualEndDate=now(), and activates the next stage in sequence. If there is no next stage, the case lifecycle is complete. The SLA check job (invoked via POST /api/workflow/sla/check) iterates all active SLAs, computes remaining time, and transitions statuses: if remaining < warningThreshold → WARNING, if remaining < 0 → BREACHED. For each transition, it calls notification-service to create a notification for the assigned user. Rollback (POST /api/workflow/cases/{caseId}/rollback) reverts to the previous stage. Skip (POST /api/workflow/cases/{caseId}/skip) jumps past the current stage with a reason.',
    details: [
      'Current stage can be fetched via GET /api/workflow/cases/{caseId}/stages/current',
      'All stages for a case via GET /api/workflow/cases/{caseId}/stages',
      'Reassignment changes who is responsible for a stage (PATCH /api/workflow/cases/{caseId}/reassign)',
      'Active SLAs across all cases: GET /api/workflow/sla/active',
      'Warning SLAs (approaching deadline): GET /api/workflow/sla/warnings',
    ],
  },
  {
    num: '6', title: 'Appeals Process', service: 'appeal-service → compliance-service → notification-service',
    simple: 'If someone disagrees with the court decision, they can file an appeal. A different judge reviews the appeal, and can either uphold the original decision, reverse it, modify it, or send it back for re-hearing. The original case status is automatically updated based on the appeal outcome.',
    technical: 'Filing an appeal is done via POST /api/appeals with caseId, filedBy, and reason. The appeal-service creates an Appeal entity with status=FILED. An admin or clerk assigns a reviewer (judge) via POST /api/appeals/{id}/review?judgeId=X, which creates an AppealReview entity and transitions the appeal to UNDER_REVIEW. The reviewing judge issues a decision via POST /api/appeals/{id}/decide?judgeId=X with a body containing outcome (UPHELD/REVERSED/MODIFIED/SENT_BACK) and remarks. This transitions the appeal to DECISION_ISSUED. The appeal-service uses OpenFeign to call case-service to update the parent case status to APPEALED. It also calls notification-service to notify all parties of the outcome.',
    details: [
      'Appeal statuses: FILED → UNDER_REVIEW → DECISION_ISSUED → CLOSED',
      'Review outcomes: UPHELD, REVERSED, MODIFIED, SENT_BACK',
      'Each appeal is linked to a specific caseId',
      'Appeals can be queried by case, user, or status',
      'Review history is maintained per appeal for audit purposes',
      'Pagination: GET /api/appeals/paginated?page=0&size=10&sort=appealId,desc',
    ],
  },
  {
    num: '7', title: 'Compliance Checks & Audits', service: 'compliance-service (standalone + cross-service)',
    simple: 'At every critical stage, the system automatically checks whether the case is compliant with legal requirements — like "were all documents verified?", "was the hearing scheduled within the required timeframe?", etc. Administrators can also create manual audits to investigate specific cases. Every check result is stored permanently so there is always a record.',
    technical: 'Compliance records are generated automatically at stage transitions. The compliance-service exposes GET /api/compliance/case/{caseId} which returns all compliance checks for a case, each with a result: PASS, FAIL, or NEEDS_REVIEW. Audits are a separate entity — admins create them via POST /api/audits with caseId, adminId, and scope. Audit findings are updated via PATCH /api/audits/{id}/findings with detailed text. Audits are closed via PATCH /api/audits/{id}/close?adminId=X, which sets the closedDate and final status. All compliance and audit data is immutable once created — records are append-only to ensure forensic integrity.',
    details: [
      'Compliance results: PASS, FAIL, NEEDS_REVIEW',
      'Audit statuses: OPEN → PENDING → CLOSED',
      'Audits track: adminId, caseId, findings, createdDate, closedDate',
      'Compliance records are paginated: GET /api/compliance/paginated?page=0&size=10',
      'Audits can be queried by admin: GET /api/audits/admin/{adminId}',
      'Immutable audit trail ensures records cannot be modified after creation',
    ],
  },
  {
    num: '8', title: 'Notifications', service: 'notification-service (event consumer)',
    simple: 'Every important event in the system triggers a notification — case filed, document verified, hearing scheduled, SLA warning, appeal decision, etc. Each user has their own notification feed. Notifications can be marked as read individually or all at once. Think of it like an inbox within the application.',
    technical: 'Other microservices call notification-service via OpenFeign to create notifications. The POST /api/notifications endpoint accepts recipientId (user email), caseId, category, subject, and message. Notifications are categorized: CASE_UPDATE, DEADLINE, HEARING, DECISION, APPEAL, SYSTEM, AUDIT, SLA_WARNING, SLA_BREACH. Users fetch their notifications via GET /api/notifications/user/{userId}. Unread notifications: GET /api/notifications/user/{userId}/unread. Unread count (polled every 30s by the frontend): GET /api/notifications/user/{userId}/count. Mark as read: PATCH /api/notifications/{id}/read. Mark all read: PATCH /api/notifications/user/{userId}/read-all.',
    details: [
      '9 notification categories covering all system events',
      'Notification statuses: READ, UNREAD',
      'The frontend polls the count endpoint every 30 seconds to show the unread badge',
      'Bulk mark-all-read is supported for convenience',
      'Notifications link to specific cases for quick navigation',
      'Paginated: GET /api/notifications/paginated?page=0&size=20&sort=notificationId,desc',
    ],
  },
  {
    num: '9', title: 'Reports & Analytics', service: 'reporting-service → all services',
    simple: 'Administrators and clerks can generate reports that pull data from ALL the other services — how many cases were filed this month, how many SLAs were breached, hearing completion rates, compliance scores, and more. Reports are saved and can be viewed later.',
    technical: 'Report generation is triggered via POST /api/reports with scope (SYSTEM, ADMIN, CLERK, LAWYER, CASE), generatedBy, and optional filters. The reporting-service uses OpenFeign to call every other microservice to aggregate data: case-service for case counts and status distribution, workflow-service for SLA metrics, hearing-service for hearing statistics, appeal-service for appeal counts, compliance-service for compliance scores. The aggregated data is stored as a Report entity with JSON content. Reports can be retrieved by admin (GET /api/reports/admin/{adminId}), by scope (GET /api/reports/scope/{scope}), or by clerk/lawyer.',
    details: [
      'Report scopes: SYSTEM (everything), ADMIN, CLERK, LAWYER, CASE (single case)',
      'Cross-service data aggregation using OpenFeign clients',
      'Reports are persisted — not just generated on-the-fly',
      'Supports pagination: GET /api/reports/paginated?page=0&size=10&sort=reportId,desc',
      'Each report records who generated it and when',
    ],
  },
]

/* ───── Architecture Details ───── */
const services = [
  { name: 'API Gateway', port: '8085', tech: 'Spring Cloud Gateway', desc: 'Single entry point for all frontend requests. Validates JWT tokens, routes requests to the correct microservice based on URL patterns, and handles CORS. The frontend never talks directly to any microservice — everything goes through the gateway.' },
  { name: 'Eureka Server', port: '8761', tech: 'Netflix Eureka (Spring Cloud)', desc: 'Service discovery server. Every microservice registers itself with Eureka on startup, announcing its host and port. When the API Gateway or any service needs to call another service, it asks Eureka "where is case-service?" and Eureka responds with the address. This means services can scale up/down without hardcoding URLs.' },
  { name: 'Config Server', port: '8888', tech: 'Spring Cloud Config', desc: 'Centralized configuration management. All microservice configurations (database URLs, feature flags, timeouts) are stored in one place. When a service starts, it fetches its config from the Config Server. This means you can change settings without redeploying — just update the config and restart the service.' },
  { name: 'IAM Service', port: '8081', tech: 'Spring Security + JWT + BCrypt', desc: 'Handles user registration, login, logout, password management, and role-based access control. Passwords are hashed with BCrypt (never stored in plain text). On login, it generates a JWT token containing the user\'s email, role, and expiration time. This token is sent with every subsequent request.' },
  { name: 'Case Service', port: '8082', tech: 'Spring Data JPA + MySQL', desc: 'Manages the entire lifecycle of legal cases — filing, document upload, document verification, status transitions, and case queries. Has its own dedicated MySQL database. Communicates with IAM service to validate users and with notification service to send alerts.' },
  { name: 'Workflow Service', port: '8083', tech: 'Spring Scheduler + OpenFeign', desc: 'Manages case lifecycle stages and SLA deadlines. Auto-initializes stages when a case becomes active. Runs scheduled jobs to check for SLA breaches. Supports stage advance, rollback, skip, reassign, and SLA extension operations.' },
  { name: 'Hearing Service', port: '8084', tech: 'Spring Data JPA + OpenFeign', desc: 'Manages judge availability slots and hearing scheduling. Prevents double-booking. Supports rescheduling with reason tracking and hearing completion with outcome recording. Calls IAM service for user details and notification service for alerts.' },
  { name: 'Appeal Service', port: '8086', tech: 'Spring Data JPA + OpenFeign', desc: 'Handles the full appeals process — filing, reviewer assignment, decision recording, and outcome tracking. Automatically updates the parent case status. Communicates with case-service, compliance-service, and notification-service.' },
  { name: 'Compliance Service', port: '8087', tech: 'Spring Data JPA', desc: 'Runs automated compliance checks at case stage transitions and provides audit management. Maintains immutable records for forensic integrity. Supports admin-led audit creation, findings documentation, and audit closure.' },
  { name: 'Notification Service', port: '8088', tech: 'Spring Data JPA', desc: 'Receives notification requests from all other services and stores them per-user. Provides notification feeds, unread counts, read/unread tracking, and bulk operations. The frontend polls the count endpoint every 30 seconds.' },
  { name: 'Reporting Service', port: '8089', tech: 'OpenFeign (cross-service calls)', desc: 'Aggregates data from all other services to generate comprehensive reports. Supports multiple report scopes and persists generated reports for future reference.' },
]

const techCategories = [
  {
    title: 'Backend Framework',
    items: [
      { name: 'Spring Boot 3.2', desc: 'The core framework for all microservices. Provides auto-configuration, embedded Tomcat server, dependency injection via Spring IoC container, and production-ready features. Each microservice is an independent Spring Boot application with its own main class annotated with @SpringBootApplication.' },
      { name: 'Spring Data JPA', desc: 'Object-Relational Mapping (ORM) layer that maps Java classes to database tables. We define entity classes with @Entity annotation and repository interfaces extending JpaRepository. Spring auto-generates SQL queries from method names — e.g., findByCaseId() automatically generates SELECT * FROM cases WHERE case_id = ?. Also supports pagination via Pageable parameter.' },
      { name: 'Spring Security', desc: 'Handles authentication and authorization. We use a custom JWT filter (OncePerRequestFilter) that intercepts every request, extracts the JWT token from the Authorization header, validates it, and sets the SecurityContext. Role-based access is enforced via @PreAuthorize annotations on controller methods.' },
    ],
  },
  {
    title: 'Cloud & Infrastructure',
    items: [
      { name: 'Spring Cloud Gateway', desc: 'Acts as the API Gateway — the single entry point for all client requests. Configured with route predicates (URL patterns like /api/cases/**) that map to downstream microservices. Also handles JWT validation at the gateway level so individual services don\'t need to re-validate tokens. Supports filters for request/response modification.' },
      { name: 'Netflix Eureka', desc: 'Service discovery server. Each microservice has @EnableDiscoveryClient and registers with Eureka on startup. The API Gateway and OpenFeign clients use Eureka to resolve service names to actual host:port addresses. This enables dynamic scaling — spin up a new instance and Eureka automatically routes traffic to it.' },
      { name: 'Spring Cloud Config', desc: 'Externalized configuration server. Instead of each service having its own application.yml with database URLs and secrets, all configs are stored centrally. Services fetch their config on startup via their bootstrap.yml which points to the Config Server. Supports environment-specific configs (dev, staging, prod).' },
      { name: 'Resilience4j', desc: 'Circuit breaker library for fault tolerance. Applied to every inter-service call via OpenFeign. If notification-service goes down, the circuit breaker trips after a configured number of failures, and subsequent calls immediately return a fallback response instead of hanging. After a timeout, it tries again. States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing).' },
      { name: 'OpenFeign', desc: 'Declarative HTTP client for inter-service communication. Instead of writing RestTemplate boilerplate, we define an interface with @FeignClient(name="case-service") and method signatures matching the target API. Spring generates the HTTP client implementation at runtime. Combined with Eureka, it automatically discovers the target service address.' },
    ],
  },
  {
    title: 'Security',
    items: [
      { name: 'JWT (JSON Web Token)', desc: 'Stateless authentication mechanism. On login, the IAM service generates a JWT containing: sub (user email), role, iat (issued at), exp (expiration). This token is Base64-encoded and signed with a secret key using HMAC-SHA256. The frontend stores it in localStorage and sends it as "Bearer {token}" in the Authorization header of every request. The gateway validates the signature and expiry before forwarding.' },
      { name: 'BCrypt Password Hashing', desc: 'All passwords are hashed using BCrypt with a work factor (salt rounds). BCrypt automatically generates a random salt for each password, so even identical passwords produce different hashes. On login, BCrypt.matches(plaintext, hash) verifies the password without ever decrypting the hash. This means even if the database is compromised, passwords remain secure.' },
      { name: 'Role-Based Access Control', desc: 'Five roles: LITIGANT, LAWYER, JUDGE, CLERK, ADMIN. Each role has different permissions. For example, only ADMIN can manage users, only CLERK/ADMIN can verify documents, only JUDGE can issue appeal decisions. The frontend conditionally renders UI elements based on the user role, and the backend independently enforces permissions via Spring Security.' },
    ],
  },
  {
    title: 'Database',
    items: [
      { name: 'MySQL (Database per Service)', desc: 'Each microservice has its own dedicated MySQL database — iam_db, case_db, workflow_db, hearing_db, appeal_db, compliance_db, notification_db, reporting_db. This is the "Database per Service" pattern. Services NEVER directly access another service\'s database. If case-service needs user data, it calls iam-service via REST API, not by querying iam_db. This ensures loose coupling and independent deployability.' },
      { name: 'JPA + Hibernate DDL Auto', desc: 'Tables are auto-created from entity class definitions using spring.jpa.hibernate.ddl-auto=update. This means the Java class IS the schema definition. Fields annotated with @Column, @Id, @GeneratedValue, etc. map directly to table columns. Relationships use @OneToMany, @ManyToOne with proper fetch types (LAZY/EAGER) and cascade settings.' },
    ],
  },
  {
    title: 'Frontend',
    items: [
      { name: 'React 18', desc: 'Component-based UI library. The entire frontend is built with functional components using React Hooks (useState, useEffect, useRef, useContext). React Router v6 handles client-side routing with nested routes and protected route wrappers. The AuthContext provides global authentication state via React Context API.' },
      { name: 'Vite', desc: 'Build tool and dev server. Provides instant Hot Module Replacement (HMR) during development and optimized production builds with tree-shaking and code splitting. The vite.config.js configures a proxy to forward /api/** requests to the API Gateway during development, avoiding CORS issues.' },
      { name: 'Bootstrap 5.3', desc: 'CSS framework for responsive layout and UI components. Loaded via CDN in index.html. We use Bootstrap\'s grid system (container, row, col-*), utility classes (d-flex, gap-3, text-muted, etc.), and components (cards, tables, badges, alerts, forms). Custom brand styling (navy/gold palette, Playfair Display font) is layered on top via CSS custom properties.' },
      { name: 'Fetch API', desc: 'Native browser API for HTTP requests (no Axios dependency). We built a custom api client (src/api/client.js) that wraps fetch with: automatic JWT token injection, JSON serialization/deserialization, error handling with meaningful messages, and support for multipart form uploads. All API calls go through this client.' },
    ],
  },
]

const roles = [
  { role: 'LITIGANT', desc: 'The person involved in a legal case (plaintiff or defendant). Can file cases, upload documents, view their cases, view hearings, file appeals, and receive notifications.', color: '#4a90d9' },
  { role: 'LAWYER', desc: 'Legal representative who acts on behalf of a litigant. Can file cases for clients, view all cases they are assigned to, file appeals, view reports, and manage hearings.', color: '#8b6cc1' },
  { role: 'JUDGE', desc: 'Presides over hearings and makes decisions. Can manage their availability slots, view assigned hearings, issue appeal decisions, and manage workflow stages.', color: '#c9a84c' },
  { role: 'CLERK', desc: 'Court administrator who keeps things running. Can verify documents, schedule hearings, advance workflow stages, run compliance checks, and generate reports.', color: '#2dd4a8' },
  { role: 'ADMIN', desc: 'System administrator with full access. Can manage users (create, suspend, delete), view all data across all modules, create audits, generate system-wide reports, and view audit logs.', color: '#f07068' },
]

const patterns = [
  { name: 'API Gateway Pattern', desc: 'Single entry point for all clients. Handles cross-cutting concerns like authentication, rate limiting, and routing. The frontend only knows about one URL (the gateway). The gateway figures out which microservice to forward the request to based on URL path patterns.' },
  { name: 'Service Discovery (Client-Side)', desc: 'Services register with Eureka and discover each other dynamically. No hardcoded URLs. If a service moves to a new server or a new instance spins up, Eureka handles it automatically.' },
  { name: 'Database per Service', desc: 'Each microservice owns its data exclusively. No shared databases. This enables independent deployment, technology heterogeneity (each service could use a different DB), and prevents tight coupling at the data layer.' },
  { name: 'Circuit Breaker', desc: 'Prevents cascading failures. If service B is down and service A keeps calling it, the circuit breaker stops the calls after N failures and returns a fallback response. After a timeout, it tries one request to see if B is back. This prevents one failing service from taking down the entire system.' },
  { name: 'Externalized Configuration', desc: 'All configuration is stored centrally in the Config Server. Services fetch their config on startup. This means you can change database URLs, feature flags, or timeouts without changing code or rebuilding the service.' },
  { name: 'Synchronous Communication (REST)', desc: 'Services communicate via REST APIs using OpenFeign. This is simpler than async messaging (no message broker needed) but means the caller waits for a response. Circuit breakers mitigate the risk of slow/failed calls.' },
]

const faqs = [
  { q: 'How does authentication work across all services?', a: 'The user logs in via the IAM service, which generates a JWT token. The frontend stores this token and sends it with every request in the Authorization header. The API Gateway intercepts every request, validates the JWT (checks signature, expiry, and role), and only forwards valid requests to downstream services. Individual services trust the gateway and extract user info from the forwarded headers.' },
  { q: 'What happens if a microservice goes down?', a: 'Resilience4j circuit breakers are applied to every inter-service call. If, say, notification-service goes down, the services that call it (workflow, hearing, case) will get a circuit breaker fallback response instead of hanging. The rest of the system keeps working normally. Cases can still be filed, hearings can still be scheduled — just notifications won\'t be sent until the service recovers.' },
  { q: 'Why not use a single database for everything?', a: 'The "Database per Service" pattern is a core microservices principle. If all services shared one database, a schema change in one service could break others. Separate databases ensure: (1) services can be deployed independently, (2) each service can optimize its schema for its specific queries, (3) a database failure only affects one service, and (4) services are truly decoupled.' },
  { q: 'How does the SLA tracking work?', a: 'When a case\'s workflow is initialized, each stage gets an SLA deadline (e.g., "Investigation must be complete within 14 days"). A scheduled job in the workflow-service runs periodically and checks all active SLAs. If currentDate is within the warning threshold of the deadline, the SLA status moves to WARNING. If currentDate exceeds the deadline, it moves to BREACHED. Both transitions trigger notifications to the responsible person.' },
  { q: 'How do services find each other?', a: 'Every microservice registers with Eureka on startup, providing its name, host, and port. When service A needs to call service B, it uses an OpenFeign client annotated with @FeignClient("service-b"). Under the hood, Feign asks Eureka "where is service-b?", gets the address, and makes the HTTP call. This means services don\'t have hardcoded URLs — they just know service names.' },
  { q: 'What is the API Gateway doing exactly?', a: 'The Spring Cloud Gateway sits at port 8085 and is the ONLY service exposed to the frontend. It has route configurations like: "if the URL starts with /api/cases/**, forward to case-service". Before forwarding, it runs a JWT authentication filter. It also handles CORS headers so the React frontend (running on a different port) can make requests without browser security errors.' },
  { q: 'How is the frontend structured?', a: 'The React app uses a single-page architecture with React Router v6. Public pages (Home, About, etc.) use a PublicLayout with Navbar and Footer. Authenticated pages use an AppLayout with a top navigation bar and offcanvas drawer. Authentication state is managed via React Context (AuthContext). All API calls go through a centralized client (src/api/client.js) that handles JWT injection and error formatting.' },
  { q: 'What does "stateless authentication" mean?', a: 'Unlike traditional session-based auth where the server stores session data, JWT is stateless — the server doesn\'t store anything. All the information (user email, role, expiry) is encoded IN the token itself. The server just validates the token\'s signature to ensure it hasn\'t been tampered with. This is perfect for microservices because any service can validate the token independently without hitting a central session store.' },
]

export default function HowItWorks() {
  return (
    <main>
      {/* ═══════ HERO ═══════ */}
      <section className="text-white" style={{ background: 'var(--cf-navy-950)', padding: '160px 0 80px' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="section-label">How It Works</span>
              <h1 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 600, lineHeight: 1.15 }}>From filing to resolution — every step automated.</h1>
              <p className="fs-5 mb-0" style={{ maxWidth: 560, color: 'rgba(255,255,255,0.5)' }}>A complete technical and functional walkthrough of how CaseFlow's 8 microservices, 11 cloud components, and 50+ API endpoints work together to manage legal cases end-to-end.</p>
            </div>
            <div className="col-lg-4 d-none d-lg-block">
              <div className="d-flex flex-column gap-2">
                {[{n:'11', l:'Spring Cloud Services'},{n:'8', l:'Dedicated Databases'},{n:'50+', l:'REST Endpoints'}].map((s,i) => (
                  <div key={i} className="d-flex align-items-center gap-3 px-3 py-2 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--cf-gold-400)', minWidth: 40 }}>{s.n}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TABLE OF CONTENTS ═══════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--cf-gray-200)', padding: '24px 0' }}>
        <div className="container">
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {['Case Lifecycle', 'Architecture', 'Tech Stack', 'User Roles', 'Design Patterns', 'FAQ'].map((s, i) => (
              <a key={i} href={`#hiw-${s.toLowerCase().replace(/ /g, '-')}`} className="btn btn-sm fw-medium"
                style={{ borderRadius: 8, padding: '6px 16px', fontSize: 13, background: 'var(--cf-navy-50)', color: 'var(--cf-navy-700)', border: '1px solid var(--cf-gray-200)', textDecoration: 'none' }}>
                {s}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CASE LIFECYCLE ═══════ */}
      <section id="hiw-case-lifecycle" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Case Lifecycle</span>
            <h2 className="section-title">Follow a case from start to finish.</h2>
            <p className="section-subtitle">Each step below shows both the simple explanation (what happens) and the technical explanation (how it happens under the hood). Click any step to see the full details.</p>
          </div>

          <div className="mx-auto" style={{ maxWidth: 860 }}>
            {lifecycle.map((step, i) => (
              <div key={i} className="d-flex gap-3 position-relative mb-2">
                {/* Timeline line & number */}
                <div className="d-flex flex-column align-items-center flex-shrink-0">
                  <span className="d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: 44, height: 44, background: 'var(--cf-navy-900)', color: 'var(--cf-gold-400)', fontFamily: 'var(--font-display)', fontSize: 18, flexShrink: 0 }}>{step.num}</span>
                  {i < lifecycle.length - 1 && <div className="flex-grow-1 my-1" style={{ width: 2, background: 'var(--cf-gray-200)' }} />}
                </div>

                {/* Content card */}
                <div className="pb-4 flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="card border shadow-sm" style={{ borderRadius: 14, overflow: 'hidden' }}>
                    <div className="card-body p-4">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                        <h3 className="h5 fw-bold text-dark mb-0">{step.title}</h3>
                        <span className="d-inline-block px-3 py-1 rounded-pill fw-semibold" style={{ background: 'var(--cf-navy-50)', color: 'var(--cf-navy-600)', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{step.service}</span>
                      </div>

                      {/* Simple explanation */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge rounded-pill" style={{ background: 'rgba(45,212,168,0.1)', color: '#1a9e7e', fontSize: 11 }}>Simple</span>
                          <span className="text-muted" style={{ fontSize: 12 }}>For everyone</span>
                        </div>
                        <p className="text-secondary mb-0" style={{ lineHeight: 1.75, fontSize: 14 }}>{step.simple}</p>
                      </div>

                      {/* Technical explanation */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge rounded-pill" style={{ background: 'rgba(139,108,193,0.1)', color: '#8b6cc1', fontSize: 11 }}>Technical</span>
                          <span className="text-muted" style={{ fontSize: 12 }}>Under the hood</span>
                        </div>
                        <p className="mb-0" style={{ lineHeight: 1.75, fontSize: 13, color: 'var(--cf-gray-700)', background: 'var(--cf-gray-50)', padding: '14px 16px', borderRadius: 10, borderLeft: '3px solid var(--cf-navy-200)' }}>{step.technical}</p>
                      </div>

                      {/* Key details */}
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge rounded-pill" style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', fontSize: 11 }}>Key Details</span>
                        </div>
                        <ul className="mb-0 ps-0" style={{ listStyle: 'none' }}>
                          {step.details.map((d, j) => (
                            <li key={j} className="d-flex align-items-start gap-2 mb-1" style={{ fontSize: 13, color: 'var(--cf-gray-700)' }}>
                              <span style={{ color: 'var(--cf-gold-400)', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ARCHITECTURE ═══════ */}
      <section id="hiw-architecture" className="section" style={{ background: 'var(--cf-navy-950)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Architecture</span>
            <h2 className="section-title text-white">11 services. One unified system.</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.45)' }}>Every request flows: Frontend → API Gateway (JWT check) → Eureka lookup → Target Service → Database. Here is every service in the system.</p>
          </div>

          {/* Request flow diagram */}
          <div className="mx-auto mb-5" style={{ maxWidth: 800 }}>
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-4" style={{ fontSize: 13 }}>
              {['React App', '→', 'API Gateway :8085', '→', 'Eureka Lookup', '→', 'Target Service', '→', 'MySQL DB'].map((s, i) => (
                <span key={i} className={i % 2 === 1 ? '' : 'px-3 py-2 rounded-3'} style={i % 2 === 1 ? { color: 'var(--cf-gold-400)', fontWeight: 700 } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#e1e6f0', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="row g-3">
            {services.map((svc, i) => (
              <div key={i} className="col-12 col-md-6">
                <div className="h-100 p-4 rounded-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <h4 className="mb-0 fw-bold" style={{ color: '#fff', fontSize: 16 }}>{svc.name}</h4>
                    <span className="fw-semibold" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--cf-gold-400)', background: 'rgba(201,168,76,0.1)', padding: '2px 10px', borderRadius: 20 }}>:{svc.port}</span>
                  </div>
                  <span className="d-inline-block mb-2" style={{ fontSize: 11, color: 'var(--cf-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{svc.tech}</span>
                  <p className="mb-0" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{svc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TECH STACK DEEP DIVE ═══════ */}
      <section id="hiw-tech-stack" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Tech Stack Deep Dive</span>
            <h2 className="section-title">Every technology explained.</h2>
            <p className="section-subtitle">Not just a list of buzzwords — here is what each technology does in CaseFlow and why we chose it.</p>
          </div>

          {techCategories.map((cat, ci) => (
            <div key={ci} className="mb-5">
              <h3 className="h5 fw-bold mb-3" style={{ color: 'var(--cf-navy-800)', fontFamily: 'var(--font-display)', borderBottom: '2px solid var(--cf-gold-100)', paddingBottom: 12 }}>{cat.title}</h3>
              <div className="row g-3">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="col-12">
                    <div className="p-4 rounded-3" style={{ background: 'var(--cf-gray-50)', border: '1px solid var(--cf-gray-200)' }}>
                      <h4 className="fw-bold mb-2" style={{ fontSize: 15, color: 'var(--cf-navy-900)' }}>{item.name}</h4>
                      <p className="mb-0 text-secondary" style={{ fontSize: 14, lineHeight: 1.75 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ USER ROLES ═══════ */}
      <section id="hiw-user-roles" className="section" style={{ background: 'var(--cf-gray-50)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">User Roles</span>
            <h2 className="section-title">Five roles. Different permissions.</h2>
            <p className="section-subtitle">CaseFlow uses Role-Based Access Control (RBAC). Each user is assigned exactly one role, and the system shows different features and enforces different permissions based on that role.</p>
          </div>

          <div className="row g-3" style={{ maxWidth: 900, margin: '0 auto' }}>
            {roles.map((r, i) => (
              <div key={i} className="col-12">
                <div className="d-flex align-items-start gap-3 p-4 rounded-3 bg-white" style={{ border: '1px solid var(--cf-gray-200)' }}>
                  <span className="fw-bold px-3 py-1 rounded-pill flex-shrink-0" style={{ fontSize: 12, background: `${r.color}15`, color: r.color, letterSpacing: '0.05em' }}>{r.role}</span>
                  <p className="mb-0 text-secondary" style={{ fontSize: 14, lineHeight: 1.7 }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DESIGN PATTERNS ═══════ */}
      <section id="hiw-design-patterns" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Design Patterns</span>
            <h2 className="section-title">Microservice patterns we implemented.</h2>
            <p className="section-subtitle">These are the industry-standard architectural patterns used in CaseFlow. Understanding these will help you explain the "why" behind our design decisions.</p>
          </div>

          <div className="row g-3" style={{ maxWidth: 900, margin: '0 auto' }}>
            {patterns.map((p, i) => (
              <div key={i} className="col-12">
                <div className="p-4 rounded-3 bg-white" style={{ border: '1px solid var(--cf-gray-200)' }}>
                  <h4 className="fw-bold mb-2" style={{ fontSize: 15, color: 'var(--cf-navy-900)' }}>{p.name}</h4>
                  <p className="mb-0 text-secondary" style={{ fontSize: 14, lineHeight: 1.75 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="hiw-faq" className="section" style={{ background: 'var(--cf-gray-50)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">FAQ</span>
            <h2 className="section-title">FAQs — <i>answered.</i></h2>
            <p className="section-subtitle">These are the questions interviewers are most likely to ask about this project. Each answer is detailed enough to use as-is in an interview.</p>
          </div>

          <div className="mx-auto" style={{ maxWidth: 860 }}>
            {faqs.map((f, i) => (
              <div key={i} className="mb-3">
                <div className="p-4 rounded-3 bg-white" style={{ border: '1px solid var(--cf-gray-200)' }}>
                  <h4 className="fw-bold mb-3 d-flex align-items-start gap-2" style={{ fontSize: 15, color: 'var(--cf-navy-900)' }}>
                    <span className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 24, height: 24, fontSize: 12, fontWeight: 700, background: 'var(--cf-navy-900)', color: 'var(--cf-gold-400)', marginTop: 1 }}>Q</span>
                    {f.q}
                  </h4>
                  <p className="mb-0 ps-4 ms-2 text-secondary" style={{ fontSize: 14, lineHeight: 1.8, borderLeft: '2px solid var(--cf-gold-100)', paddingLeft: 16 }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="section" style={{ background: 'var(--cf-navy-950)' }}>
        <div className="container text-center">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, color: '#fff', marginBottom: 12 }}>Ready to explore the platform?</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 480, margin: '0 auto 28px', fontSize: 15 }}>Sign in to see all these services working together in real time.</p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/login" className="btn btn-gold btn-lg">Get Started</Link>
            <Link to="/about" className="btn btn-outline-light rounded-pill">About the Team</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
