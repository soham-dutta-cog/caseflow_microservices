package com.caseflow.compliance.controller;

import com.caseflow.compliance.dto.*;
import com.caseflow.compliance.service.ComplianceServiceImpl;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Compliance & Audit", description = "Compliance checks and audit management")
public class ComplianceController {
    private final ComplianceServiceImpl complianceService;

    @GetMapping("/api/compliance/case/{caseId}")
    public ResponseEntity<List<ComplianceRecordResponse>> getByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(complianceService.getComplianceRecordsByCase(caseId));
    }

    @PostMapping("/api/audits")
    public ResponseEntity<AuditResponse> createAudit(@Valid @RequestBody AuditRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complianceService.createAudit(request));
    }

    @GetMapping("/api/audits/{id}")
    public ResponseEntity<AuditResponse> getAudit(@PathVariable Long id) {
        return ResponseEntity.ok(complianceService.getAuditById(id));
    }

    @PatchMapping("/api/audits/{id}/findings")
    public ResponseEntity<AuditResponse> updateFindings(@PathVariable Long id, @RequestBody String findings) {
        return ResponseEntity.ok(complianceService.updateFindings(id, findings));
    }

    @PatchMapping("/api/audits/{id}/close")
    public ResponseEntity<AuditResponse> closeAudit(@PathVariable Long id, @RequestParam Long adminId) {
        return ResponseEntity.ok(complianceService.closeAudit(id, adminId));
    }

    @GetMapping("/api/audits/admin/{adminId}")
    public ResponseEntity<List<AuditResponse>> getAuditsByAdmin(@PathVariable Long adminId) {
        return ResponseEntity.ok(complianceService.getAuditsByAdmin(adminId));
    }
}
