package com.caseflow.reporting.controller;

import com.caseflow.reporting.dto.*;
import com.caseflow.reporting.entity.Report.ReportScope;
import com.caseflow.reporting.service.ReportServiceImpl;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/reports") @RequiredArgsConstructor
@Tag(name = "Reporting & Analytics", description = "Generate and retrieve system reports")
public class ReportController {
    private final ReportServiceImpl reportService;

    @PostMapping public ResponseEntity<ReportResponse> generateReport(@Valid @RequestBody ReportRequest request) { return ResponseEntity.status(HttpStatus.CREATED).body(reportService.generateReport(request)); }
    @GetMapping("/{id}") public ResponseEntity<ReportResponse> getReportById(@PathVariable Long id) { return ResponseEntity.ok(reportService.getReportById(id)); }
    @GetMapping("/admin/{adminId}") public ResponseEntity<List<ReportResponse>> getByAdmin(@PathVariable Long adminId) { return ResponseEntity.ok(reportService.getReportsByAdmin(adminId)); }
    @GetMapping("/scope/{scope}") public ResponseEntity<List<ReportResponse>> getByScope(@PathVariable ReportScope scope) { return ResponseEntity.ok(reportService.getReportsByScope(scope)); }
}
