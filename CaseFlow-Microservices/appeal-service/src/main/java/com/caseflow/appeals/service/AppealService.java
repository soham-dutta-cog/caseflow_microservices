package com.caseflow.appeals.service;

import com.caseflow.appeals.client.CaseServiceClient;
import com.caseflow.appeals.client.NotificationServiceClient;
import com.caseflow.appeals.dto.request.AppealRequest;
import com.caseflow.appeals.dto.response.AppealResponse;
import com.caseflow.appeals.dto.response.CaseOwnerInfo;
import com.caseflow.appeals.entity.Appeal;
import com.caseflow.appeals.entity.Appeal.AppealStatus;
import com.caseflow.appeals.exception.DuplicateResourceException;
import com.caseflow.appeals.exception.InvalidOperationException;
import com.caseflow.appeals.exception.ResourceNotFoundException;
import com.caseflow.appeals.repository.AppealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Handles all appeal-related business logic:
 * - Filing a new appeal
 * - Cancelling an appeal
 * - All appeal read operations
 *
 * Review-related logic lives in {@link ReviewService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AppealService {

    private final AppealRepository          appealRepository;
    private final CaseServiceClient         caseClient;
    private final NotificationServiceClient notificationClient;

    // ─── File Appeal ─────────────────────────────────────────────────────────

    /**
     * File a new appeal.
     * - filedByUserId is taken from the JWT (X-Auth-User-Id), never from the request body.
     * - Ownership guard: LITIGANT → only their own case,
     *                    LAWYER  → only their assigned case,
     *                    ADMIN   → any case.
     * - Blocks filing if a SUBMITTED or REVIEWED appeal already exists for the case.
     */
    public AppealResponse fileAppeal(AppealRequest request, String currentUserId, String userRole) {
        if (currentUserId == null || currentUserId.isBlank()) {
            throw new InvalidOperationException(
                "Unable to identify the current user. Please re-login.");
        }

        // Single call to case-service: fetch status + ownership together
        CaseOwnerInfo caseInfo = caseClient.getCaseDetails(request.getCaseId());
        if (caseInfo == null) {
            throw new InvalidOperationException(
                "Cannot validate case — case service is temporarily unavailable. Please try again.");
        }

        if (!"CLOSED".equals(caseInfo.getStatus())) {
            throw new InvalidOperationException(
                "Appeals can only be filed on CLOSED cases. Current case status: " + caseInfo.getStatus());
        }

        // Ownership guard — ADMIN bypasses
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            if ("LITIGANT".equalsIgnoreCase(userRole)) {
                if (!currentUserId.equals(caseInfo.getLitigantId())) {
                    throw new InvalidOperationException(
                        "Access denied: You can only file an appeal for your own case. " +
                        "Case #" + request.getCaseId() + " belongs to a different litigant.");
                }
            } else if ("LAWYER".equalsIgnoreCase(userRole)) {
                if (caseInfo.getLawyerId() == null || !currentUserId.equals(caseInfo.getLawyerId())) {
                    throw new InvalidOperationException(
                        "Access denied: You can only file an appeal for cases where you are the assigned lawyer. " +
                        "You are not assigned to case #" + request.getCaseId() + ".");
                }
            }
        }
        log.info("Ownership check passed for case #{} by {} [{}]",
            request.getCaseId(), userRole, currentUserId);

        // Block if an active appeal already exists
        if (appealRepository.existsByCaseIdAndStatus(request.getCaseId(), AppealStatus.SUBMITTED)
                || appealRepository.existsByCaseIdAndStatus(request.getCaseId(), AppealStatus.REVIEWED)) {
            throw new DuplicateResourceException(
                "An active appeal (SUBMITTED or REVIEWED) already exists for case #"
                + request.getCaseId()
                + ". Wait for it to be decided before filing a new one.");
        }

        Appeal appeal = Appeal.builder()
            .caseId(request.getCaseId())
            .filedByUserId(currentUserId)
            .filedDate(LocalDate.now())
            .reason(request.getReason())
            .status(AppealStatus.SUBMITTED)
            .build();
        appeal = appealRepository.save(appeal);
        log.info("Appeal #{} filed for case #{} by [{}]",
            appeal.getAppealId(), appeal.getCaseId(), currentUserId);

        try {
            notificationClient.sendNotification(Map.of(
                "type",    "APPEAL_FILED",
                "caseId",  request.getCaseId(),
                "userId",  currentUserId,
                "message", "Your appeal for case #" + request.getCaseId()
                           + " has been submitted successfully."
            ));
        } catch (Exception e) {
            log.warn("Failed to send APPEAL_FILED notification for appeal #{}: {}",
                appeal.getAppealId(), e.getMessage());
        }

        return toAppealResponse(appeal);
    }

    // ─── Cancel Appeal ───────────────────────────────────────────────────────

    /**
     * Cancel/withdraw an appeal.
     * - LITIGANT / LAWYER : can cancel only their own SUBMITTED appeal.
     * - ADMIN             : can cancel any SUBMITTED or REVIEWED appeal.
     * - DECIDED / CANCELLED appeals cannot be cancelled.
     * - After cancellation a new appeal CAN be filed for the same case.
     */
    public AppealResponse cancelAppeal(Long appealId, String currentUserId, String userRole) {
        Appeal appeal = findAppealOrThrow(appealId);

        boolean isAdmin  = "ADMIN".equalsIgnoreCase(userRole);
        boolean isFiler  = currentUserId.equals(appeal.getFiledByUserId());

        if (appeal.getStatus() == AppealStatus.DECIDED) {
            throw new InvalidOperationException(
                "Appeal #" + appealId + " has already been DECIDED and cannot be cancelled.");
        }
        if (appeal.getStatus() == AppealStatus.CANCELLED) {
            throw new InvalidOperationException(
                "Appeal #" + appealId + " is already CANCELLED.");
        }
        if (appeal.getStatus() == AppealStatus.REVIEWED && !isAdmin) {
            throw new InvalidOperationException(
                "Appeal #" + appealId + " is already under review and cannot be withdrawn by the filer. " +
                "Contact an administrator.");
        }
        if (!isAdmin && !isFiler) {
            throw new InvalidOperationException(
                "Access denied: Only the person who filed this appeal or an ADMIN can cancel it.");
        }

        appeal.setStatus(AppealStatus.CANCELLED);
        appeal = appealRepository.save(appeal);
        log.info("Appeal #{} cancelled by {} [{}]", appealId, userRole, currentUserId);

        try {
            notificationClient.sendNotification(Map.of(
                "type",    "APPEAL_CANCELLED",
                "caseId",  appeal.getCaseId(),
                "userId",  appeal.getFiledByUserId(),
                "message", "Appeal #" + appealId + " for case #" + appeal.getCaseId()
                           + " has been cancelled."
            ));
        } catch (Exception e) {
            log.warn("Failed to send APPEAL_CANCELLED notification for appeal #{}: {}",
                appealId, e.getMessage());
        }

        return toAppealResponse(appeal);
    }

    // ─── Read Operations ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AppealResponse getAppealById(Long id) {
        return toAppealResponse(findAppealOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<AppealResponse> getAppealsByCase(Long caseId) {
        return appealRepository.findByCaseId(caseId)
            .stream().map(this::toAppealResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AppealResponse> getAppealsByUser(String userId) {
        return appealRepository.findByFiledByUserId(userId)
            .stream().map(this::toAppealResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AppealResponse> getAppealsByStatus(AppealStatus status) {
        return appealRepository.findByStatus(status)
            .stream().map(this::toAppealResponse).toList();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Appeal findAppealOrThrow(Long id) {
        return appealRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: #" + id));
    }

    private AppealResponse toAppealResponse(Appeal a) {
        return AppealResponse.builder()
            .appealId(a.getAppealId())
            .caseId(a.getCaseId())
            .filedByUserId(a.getFiledByUserId())
            .filedDate(a.getFiledDate())
            .reason(a.getReason())
            .status(a.getStatus())
            .build();
    }
}
