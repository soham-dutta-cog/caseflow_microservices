package com.caseflow.cases.service;

import com.caseflow.cases.client.*;
import com.caseflow.cases.dto.*;
import com.caseflow.cases.entity.Case;
import com.caseflow.cases.entity.Document;
import com.caseflow.cases.exception.*;
import com.caseflow.cases.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class CaseService {
    private final CaseRepository caseRepository;
    private final DocumentRepository documentRepository;
    private final IamServiceClient iamClient;
    private final WorkflowServiceClient workflowClient;
    private final NotificationServiceClient notificationClient;

    public CaseResponse fileCase(CaseRequest request) {
        if (!iamClient.existsById(request.getLitigantId()))
            throw new ResourceNotFoundException("Litigant not found: " + request.getLitigantId());
        Case newCase = Case.builder().title(request.getTitle()).litigantId(request.getLitigantId())
            .lawyerId(request.getLawyerId()).filedDate(LocalDateTime.now())
            .status(Case.CaseStatus.FILED).build();
        Case saved = caseRepository.save(newCase);
        sendNotification(request.getLitigantId(), saved.getCaseId(),
            "Your case '" + saved.getTitle() + "' (Case #" + saved.getCaseId() + ") has been filed.", "CASE");
        return mapToCaseResponse(saved);
    }

    public DocumentResponse uploadDocument(DocumentRequest request) {
        Case existingCase = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + request.getCaseId()));
        if (existingCase.getStatus() == Case.CaseStatus.CLOSED)
            throw new InvalidOperationException("Cannot upload documents to a CLOSED case");
        Document doc = Document.builder().caseId(request.getCaseId()).title(request.getTitle())
            .type(request.getType()).uri(request.getUri()).uploadedDate(LocalDateTime.now())
            .verificationStatus(Document.VerificationStatus.PENDING).uploadedBy(request.getUploadedBy()).build();
        return mapToDocumentResponse(documentRepository.save(doc));
    }

    public DocumentResponse verifyDocument(Long documentId, VerificationRequest request) {
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        if (request.getStatus() == Document.VerificationStatus.REJECTED
                && (request.getRejectionReason() == null || request.getRejectionReason().isBlank()))
            throw new InvalidOperationException("Rejection reason is required");
        doc.setVerificationStatus(request.getStatus());
        doc.setRejectionReason(request.getStatus() == Document.VerificationStatus.REJECTED
            ? request.getRejectionReason() : null);
        Document saved = documentRepository.save(doc);
        checkAndActivateCase(doc.getCaseId());
        return mapToDocumentResponse(saved);
    }

    private void checkAndActivateCase(Long caseId) {
        long total = documentRepository.countByCaseId(caseId);
        long verified = documentRepository.countByCaseIdAndVerificationStatus(caseId, Document.VerificationStatus.VERIFIED);
        if (total > 0 && total == verified) {
            Case c = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("Case not found"));
            if (c.getStatus() == Case.CaseStatus.FILED) {
                c.setStatus(Case.CaseStatus.ACTIVE);
                caseRepository.save(c);
                try { workflowClient.advanceWorkflow(caseId); } catch (Exception e) {
                    log.warn("Failed to advance workflow for case {}: {}", caseId, e.getMessage());
                }
            }
        }
    }

    public CaseResponse updateCaseStatus(Long caseId, Case.CaseStatus newStatus) {
        Case c = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        c.setStatus(newStatus);
        return mapToCaseResponse(caseRepository.save(c));
    }

    public CaseResponse getCaseById(Long caseId) {
        return mapToCaseResponse(caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId)));
    }

    public List<CaseResponse> getAllCases() { return caseRepository.findAll().stream().map(this::mapToCaseResponse).toList(); }
    public List<CaseResponse> getCasesByLitigant(Long id) { return caseRepository.findByLitigantId(id).stream().map(this::mapToCaseResponse).toList(); }
    public List<CaseResponse> getCasesByLawyer(Long id) { return caseRepository.findByLawyerId(id).stream().map(this::mapToCaseResponse).toList(); }
    public List<CaseResponse> getCasesByStatus(Case.CaseStatus s) { return caseRepository.findByStatus(s).stream().map(this::mapToCaseResponse).toList(); }
    public List<DocumentResponse> getDocumentsByCaseId(Long id) { return documentRepository.findByCaseId(id).stream().map(this::mapToDocumentResponse).toList(); }
    public List<DocumentResponse> getPendingDocuments() { return documentRepository.findByVerificationStatus(Document.VerificationStatus.PENDING).stream().map(this::mapToDocumentResponse).toList(); }
    public DocumentResponse getDocumentById(Long id) { return mapToDocumentResponse(documentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id))); }

    // Internal endpoint for other services
    public void setCaseType(Long caseId, String caseType) {
        Case c = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        c.setCaseType(caseType);
        caseRepository.save(c);
    }

    private void sendNotification(Long userId, Long caseId, String message, String category) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("userId", userId); req.put("caseId", caseId);
            req.put("message", message); req.put("category", category);
            notificationClient.sendNotification(req);
        } catch (Exception e) { log.warn("Notification failed: {}", e.getMessage()); }
    }

    private CaseResponse mapToCaseResponse(Case c) {
        CaseResponse res = new CaseResponse();
        res.setCaseId(c.getCaseId()); res.setTitle(c.getTitle());
        res.setLitigantId(c.getLitigantId()); res.setLawyerId(c.getLawyerId());
        res.setFiledDate(c.getFiledDate()); res.setStatus(c.getStatus());
        return res;
    }

    private DocumentResponse mapToDocumentResponse(Document d) {
        DocumentResponse res = new DocumentResponse();
        res.setDocumentId(d.getDocumentId()); res.setCaseId(d.getCaseId());
        res.setTitle(d.getTitle()); res.setType(d.getType());
        res.setUri(d.getUri()); res.setUploadedDate(d.getUploadedDate());
        res.setVerificationStatus(d.getVerificationStatus());
        res.setUploadedBy(d.getUploadedBy()); res.setRejectionReason(d.getRejectionReason());
        return res;
    }
}
