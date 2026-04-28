package com.caseflow.reporting.service;

import com.caseflow.reporting.entity.Report;
import com.caseflow.reporting.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CachedReportService {

    private final ReportRepository reportRepository;

    public Page<Report> getAllReportsPaginated(Pageable pageable) {
        return reportRepository.findAll(pageable);
    }

    @Cacheable(value = "reports", key = "#reportId")
    public Report getCachedReportById(Long reportId) {
        return reportRepository.findById(reportId).orElse(null);
    }
}
