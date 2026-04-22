package com.caseflow.reporting.controller;

import com.caseflow.reporting.entity.Report;
import com.caseflow.reporting.service.CachedReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports/paginated")
@RequiredArgsConstructor
@Tag(name = "Reports — Paginated", description = "Paginated report endpoints")
public class PaginatedReportController {

    private final CachedReportService cachedReportService;

    @GetMapping
    @Operation(summary = "Get all reports (paginated)")
    public ResponseEntity<Page<Report>> getAllReportsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "reportId,desc") String sort) {
        String[] s = sort.split(",");
        return ResponseEntity.ok(cachedReportService.getAllReportsPaginated(
            PageRequest.of(page, size, Sort.by(s.length > 1 && s[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, s[0]))));
    }
}
