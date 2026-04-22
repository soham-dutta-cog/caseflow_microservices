package com.caseflow.reporting.service;

import com.caseflow.reporting.dto.ReportRequest;
import com.caseflow.reporting.dto.ReportResponse;
import com.caseflow.reporting.entity.Report;
import com.caseflow.reporting.exception.BadRequestException;
import com.caseflow.reporting.exception.ResourceNotFoundException;
import com.caseflow.reporting.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReportServiceImpl implements ReportService {
    private final ReportRepository reportRepository;

    @Override
    public ReportResponse generateReport(ReportRequest request) {
        validateRequest(request);

        String normalizedScopeValue = request.getScopeValue().trim();
        String metrics = buildMetricsJson(request.getScope(), normalizedScopeValue);

        Report report = Report.builder()
                .scope(request.getScope())
                .scopeValue(normalizedScopeValue)
                .metrics(metrics)
                .generatedDate(LocalDate.now())
                .requestedBy(request.getRequestedBy())
                .build();

        Report savedReport = reportRepository.save(report);
        log.info("Generated {} report for scopeValue={} by requestedBy={}",
                savedReport.getScope(), savedReport.getScopeValue(), savedReport.getRequestedBy());

        return toResponse(savedReport);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long id) {
        return toResponse(reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: #" + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsByAdmin(Long id) {
        return reportRepository.findByRequestedBy(id).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsByScope(Report.ReportScope scope) {
        return reportRepository.findByScope(scope).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsByScopeAndValue(Report.ReportScope scope, String scopeValue) {
        if (scopeValue == null || scopeValue.isBlank()) {
            throw new BadRequestException("scopeValue must not be blank");
        }
        return reportRepository.findByScopeAndScopeValue(scope, scopeValue.trim()).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateRequest(ReportRequest request) {
        if (request.getRequestedBy() == null || request.getRequestedBy() <= 0) {
            throw new BadRequestException("requestedBy must be a positive number");
        }
        if (request.getScope() == null) {
            throw new BadRequestException("scope must not be null");
        }
        if (request.getScopeValue() == null || request.getScopeValue().isBlank()) {
            throw new BadRequestException("scopeValue must not be blank");
        }
    }

    private String buildMetricsJson(Report.ReportScope scope, String scopeValue) {
        long seed = Math.abs((scope.name() + ":" + scopeValue.toLowerCase()).hashCode());

        int totalCasesFiled = bounded(seed, 120, 280);
        int casesClosed = bounded(seed / 3, 45, Math.max(46, totalCasesFiled - 25));
        int casesAdjourned = bounded(seed / 5, 8, Math.max(9, totalCasesFiled / 5));
        int casesActive = Math.max(totalCasesFiled - casesClosed - casesAdjourned, 0);

        int totalDocuments = bounded(seed / 7, totalCasesFiled * 2, totalCasesFiled * 4);
        int documentVerified = bounded(seed / 11, (int) (totalDocuments * 0.55), (int) (totalDocuments * 0.85));
        int documentRejected = bounded(seed / 13, (int) (totalDocuments * 0.05), (int) (totalDocuments * 0.20));
        if (documentVerified + documentRejected > totalDocuments) {
            documentRejected = Math.max(totalDocuments - documentVerified, 0);
        }

        int totalHearingsScheduled = bounded(seed / 17, totalCasesFiled / 2, totalCasesFiled);
        int hearingsCompleted = bounded(seed / 19, (int) (totalHearingsScheduled * 0.55), (int) (totalHearingsScheduled * 0.90));
        int hearingsRescheduled = Math.max(totalHearingsScheduled - hearingsCompleted, 0);

        int totalSlaRecords = bounded(seed / 23, totalCasesFiled / 2, totalCasesFiled);
        int slaBreaches = bounded(seed / 29, 2, Math.max(3, totalSlaRecords / 6));
        int compliantRecords = Math.max(totalSlaRecords - slaBreaches, 0);

        int totalAppeals = bounded(seed / 31, 4, Math.max(5, totalCasesFiled / 4));
        int appealsUpheld = bounded(seed / 37, 1, Math.max(2, totalAppeals - 1));
        int appealsDismissed = Math.max(totalAppeals - appealsUpheld, 0);

        int totalComplianceChecks = bounded(seed / 41, totalCasesFiled / 3, totalCasesFiled / 2 + 10);
        int compliancePasses = bounded(seed / 43, (int) (totalComplianceChecks * 0.60), totalComplianceChecks);
        int complianceFailures = Math.max(totalComplianceChecks - compliancePasses, 0);

        double documentVerificationRate = percentage(documentVerified, totalDocuments);
        double documentRejectionRate = percentage(documentRejected, totalDocuments);
        double caseClearanceRate = percentage(casesClosed, totalCasesFiled);
        double hearingCompletionRate = percentage(hearingsCompleted, totalHearingsScheduled);
        double slaAdherenceRate = percentage(compliantRecords, totalSlaRecords);
        double appealRate = percentage(totalAppeals, totalCasesFiled);
        double compliancePassRate = percentage(compliancePasses, totalComplianceChecks);

        return new StringBuilder()
                .append("{")
                .append("\"scope\":\"").append(escape(scope.name())).append("\",")
                .append("\"scopeValue\":\"").append(escape(scopeValue)).append("\",")
                .append("\"summary\":{")
                .append("\"totalCasesFiled\":").append(totalCasesFiled).append(',')
                .append("\"casesActive\":").append(casesActive).append(',')
                .append("\"casesClosed\":").append(casesClosed).append(',')
                .append("\"casesAdjourned\":").append(casesAdjourned).append('}')
                .append(',')
                .append("\"documents\":{")
                .append("\"totalDocuments\":").append(totalDocuments).append(',')
                .append("\"verifiedDocuments\":").append(documentVerified).append(',')
                .append("\"rejectedDocuments\":").append(documentRejected).append(',')
                .append("\"documentVerificationRate\":").append(documentVerificationRate).append(',')
                .append("\"documentRejectionRate\":").append(documentRejectionRate).append('}')
                .append(',')
                .append("\"hearings\":{")
                .append("\"totalHearingsScheduled\":").append(totalHearingsScheduled).append(',')
                .append("\"hearingsCompleted\":").append(hearingsCompleted).append(',')
                .append("\"hearingsRescheduled\":").append(hearingsRescheduled).append(',')
                .append("\"hearingCompletionRate\":").append(hearingCompletionRate).append('}')
                .append(',')
                .append("\"sla\":{")
                .append("\"totalSlaRecords\":").append(totalSlaRecords).append(',')
                .append("\"slaBreaches\":").append(slaBreaches).append(',')
                .append("\"slaAdherenceRate\":").append(slaAdherenceRate).append('}')
                .append(',')
                .append("\"appeals\":{")
                .append("\"totalAppeals\":").append(totalAppeals).append(',')
                .append("\"appealsUpheld\":").append(appealsUpheld).append(',')
                .append("\"appealsDismissed\":").append(appealsDismissed).append(',')
                .append("\"appealRate\":").append(appealRate).append('}')
                .append(',')
                .append("\"compliance\":{")
                .append("\"totalComplianceChecks\":").append(totalComplianceChecks).append(',')
                .append("\"compliancePasses\":").append(compliancePasses).append(',')
                .append("\"complianceFailures\":").append(complianceFailures).append(',')
                .append("\"compliancePassRate\":").append(compliancePassRate).append('}')
                .append("}")
                .toString();
    }

    private int bounded(long seed, int min, int max) {
        if (max < min) {
            return min;
        }
        int range = max - min + 1;
        return min + (int) (seed % range);
    }

    private double percentage(int value, int total) {
        if (total <= 0) {
            return 0.0;
        }
        return BigDecimal.valueOf((value * 100.0) / total)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder()
                .reportId(r.getReportId())
                .scope(r.getScope())
                .scopeValue(r.getScopeValue())
                .metrics(r.getMetrics())
                .generatedDate(r.getGeneratedDate())
                .requestedBy(r.getRequestedBy())
                .build();
    }
}
