package com.caseflow.appeals.controller;

import com.caseflow.appeals.entity.Appeal;
import com.caseflow.appeals.entity.Review;
import com.caseflow.appeals.service.CachedAppealService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appeals/paginated")
@RequiredArgsConstructor
@Tag(name = "Appeals — Paginated", description = "Paginated appeal endpoints")
public class PaginatedAppealController {

    private final CachedAppealService cachedAppealService;

    @GetMapping
    @Operation(summary = "Get all appeals (paginated)")
    public ResponseEntity<Page<Appeal>> getAllAppealsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appealId,desc") String sort) {
        String[] s = sort.split(",");
        return ResponseEntity.ok(cachedAppealService.getAllAppealsPaginated(
            PageRequest.of(page, size, Sort.by(s.length > 1 && s[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, s[0]))));
    }

    @GetMapping("/reviews")
    @Operation(summary = "Get all reviews (paginated)")
    public ResponseEntity<Page<Review>> getAllReviewsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(cachedAppealService.getAllReviewsPaginated(PageRequest.of(page, size)));
    }
}
