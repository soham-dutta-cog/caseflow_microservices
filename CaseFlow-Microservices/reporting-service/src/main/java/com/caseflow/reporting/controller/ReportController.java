package com.caseflow.reporting.controller;

import com.caseflow.reporting.dto.ReportRequest;
import com.caseflow.reporting.dto.ReportResponse;
import com.caseflow.reporting.entity.Report.ReportScope;
import com.caseflow.reporting.service.ReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reporting & Analytics", description = "Generate and retrieve system reports")
public class ReportController {
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> generateReport(@Valid @RequestBody ReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.generateReport(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @GetMapping("/admin/{adminId}")
    public ResponseEntity<List<ReportResponse>> getByAdmin(@PathVariable Long adminId) {
        return ResponseEntity.ok(reportService.getReportsByAdmin(adminId));
    }

    @GetMapping("/scope/{scope}")
    public ResponseEntity<List<ReportResponse>> getByScope(@PathVariable ReportScope scope) {
        return ResponseEntity.ok(reportService.getReportsByScope(scope));
    }

    @GetMapping("/clerk/{clerkId}")
    public ResponseEntity<List<ReportResponse>> getByClerk(@PathVariable String clerkId) {
        return ResponseEntity.ok(reportService.getReportsByScopeAndValue(ReportScope.CLERK, clerkId));
    }

    @GetMapping("/lawyer/{lawyerId}")
    public ResponseEntity<List<ReportResponse>> getByLawyer(@PathVariable String lawyerId) {
        return ResponseEntity.ok(reportService.getReportsByScopeAndValue(ReportScope.LAWYER, lawyerId));
    }
}
