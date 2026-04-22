package com.caseflow.reporting.service;

import com.caseflow.reporting.dto.ReportRequest;
import com.caseflow.reporting.dto.ReportResponse;
import com.caseflow.reporting.entity.Report;

import java.util.List;

public interface ReportService {
    ReportResponse generateReport(ReportRequest request);
    ReportResponse getReportById(Long id);
    List<ReportResponse> getReportsByAdmin(Long id);
    List<ReportResponse> getReportsByScope(Report.ReportScope scope);
    List<ReportResponse> getReportsByScopeAndValue(Report.ReportScope scope, String scopeValue);
}
