package com.caseflow.reporting.service;

import com.caseflow.reporting.dto.*;
import com.caseflow.reporting.entity.Report;
import com.caseflow.reporting.exception.*;
import com.caseflow.reporting.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service @RequiredArgsConstructor @Slf4j @Transactional
public class ReportServiceImpl {
    private final ReportRepository reportRepository;

    public ReportResponse generateReport(ReportRequest request) {
        Report report = Report.builder().scope(request.getScope()).scopeValue(request.getScopeValue())
            .metrics("{}").generatedDate(LocalDate.now()).requestedBy(request.getRequestedBy()).build();
        report = reportRepository.save(report);
        return toResponse(report);
    }

    @Transactional(readOnly = true) public ReportResponse getReportById(Long id) {
        return toResponse(reportRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Report not found: #" + id)));
    }
    @Transactional(readOnly = true) public List<ReportResponse> getReportsByAdmin(Long id) {
        return reportRepository.findByRequestedBy(id).stream().map(this::toResponse).toList();
    }
    @Transactional(readOnly = true) public List<ReportResponse> getReportsByScope(Report.ReportScope scope) {
        return reportRepository.findByScope(scope).stream().map(this::toResponse).toList();
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder().reportId(r.getReportId()).scope(r.getScope())
            .scopeValue(r.getScopeValue()).metrics(r.getMetrics())
            .generatedDate(r.getGeneratedDate()).requestedBy(r.getRequestedBy()).build();
    }
}
