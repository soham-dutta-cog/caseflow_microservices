package com.caseflow.cases.controller;

import com.caseflow.cases.dto.*;
import com.caseflow.cases.entity.Case;
import com.caseflow.cases.service.CaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/cases") @RequiredArgsConstructor
@Tag(name = "Case Filing & Documentation", description = "File cases, upload documents, verify/reject documents")
public class CaseController {
    private final CaseService caseService;

    @PostMapping("/file") @Operation(summary = "File a new case")
    public ResponseEntity<CaseResponse> fileCase(@Valid @RequestBody CaseRequest request) {
        return ResponseEntity.ok(caseService.fileCase(request));
    }

    @PostMapping("/documents/upload") @Operation(summary = "Upload a document to a case")
    public ResponseEntity<DocumentResponse> uploadDocument(@Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.ok(caseService.uploadDocument(request));
    }

    @PatchMapping("/documents/{documentId}/verify") @Operation(summary = "Verify or reject a document")
    public ResponseEntity<DocumentResponse> verifyDocument(@PathVariable Long documentId,
            @Valid @RequestBody VerificationRequest request) {
        return ResponseEntity.ok(caseService.verifyDocument(documentId, request));
    }

    @PatchMapping("/{caseId}/status") @Operation(summary = "Update case status")
    public ResponseEntity<CaseResponse> updateCaseStatus(@PathVariable Long caseId,
            @RequestParam Case.CaseStatus newStatus) {
        return ResponseEntity.ok(caseService.updateCaseStatus(caseId, newStatus));
    }

    @GetMapping("/{caseId}") public ResponseEntity<CaseResponse> getCaseById(@PathVariable Long caseId) {
        return ResponseEntity.ok(caseService.getCaseById(caseId));
    }
    @GetMapping public ResponseEntity<List<CaseResponse>> getAllCases() { return ResponseEntity.ok(caseService.getAllCases()); }
    @GetMapping("/litigant/{litigantId}") public ResponseEntity<List<CaseResponse>> getCasesByLitigant(@PathVariable Long litigantId) {
        return ResponseEntity.ok(caseService.getCasesByLitigant(litigantId));
    }
    @GetMapping("/lawyer/{lawyerId}") public ResponseEntity<List<CaseResponse>> getCasesByLawyer(@PathVariable Long lawyerId) {
        return ResponseEntity.ok(caseService.getCasesByLawyer(lawyerId));
    }
    @GetMapping("/status/{status}") public ResponseEntity<List<CaseResponse>> getCasesByStatus(@PathVariable Case.CaseStatus status) {
        return ResponseEntity.ok(caseService.getCasesByStatus(status));
    }
    @GetMapping("/{caseId}/documents") public ResponseEntity<List<DocumentResponse>> getDocumentsByCaseId(@PathVariable Long caseId) {
        return ResponseEntity.ok(caseService.getDocumentsByCaseId(caseId));
    }
    @GetMapping("/documents/pending") public ResponseEntity<List<DocumentResponse>> getPendingDocuments() {
        return ResponseEntity.ok(caseService.getPendingDocuments());
    }
    @GetMapping("/documents/{documentId}") public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable Long documentId) {
        return ResponseEntity.ok(caseService.getDocumentById(documentId));
    }

    // Internal endpoint for other services
    @PatchMapping("/internal/{caseId}/type")
    public ResponseEntity<Void> setCaseType(@PathVariable Long caseId, @RequestParam String caseType) {
        caseService.setCaseType(caseId, caseType);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/internal/{caseId}/status")
    public ResponseEntity<CaseResponse> updateCaseStatusInternal(@PathVariable Long caseId, @RequestParam Case.CaseStatus newStatus) {
        return ResponseEntity.ok(caseService.updateCaseStatus(caseId, newStatus));
    }
}
