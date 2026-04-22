package com.caseflow.compliance.controller;

import com.caseflow.compliance.entity.ComplianceRecord;
import com.caseflow.compliance.entity.Audit;
import com.caseflow.compliance.service.CachedComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Compliance — Paginated", description = "Paginated compliance endpoints")
public class PaginatedComplianceController {

    private final CachedComplianceService cachedComplianceService;

    @GetMapping("/api/compliance/paginated")
    @Operation(summary = "Get all compliance records (paginated)")
    public ResponseEntity<Page<ComplianceRecord>> getAllRecordsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(cachedComplianceService.getAllComplianceRecordsPaginated(PageRequest.of(page, size)));
    }

    @GetMapping("/api/audits/paginated")
    @Operation(summary = "Get all audits (paginated)")
    public ResponseEntity<Page<Audit>> getAllAuditsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(cachedComplianceService.getAllAuditsPaginated(PageRequest.of(page, size)));
    }
}
