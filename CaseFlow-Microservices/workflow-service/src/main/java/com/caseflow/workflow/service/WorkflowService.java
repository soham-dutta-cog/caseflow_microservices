package com.caseflow.workflow.service;

import com.caseflow.workflow.client.*;
import com.caseflow.workflow.dto.*;
import com.caseflow.workflow.entity.*;
import com.caseflow.workflow.exception.*;
import com.caseflow.workflow.repository.*;
import com.caseflow.workflow.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j @Service @RequiredArgsConstructor
public class WorkflowService {
    private final WorkflowStageRepository workflowStageRepository;
    private final SLARecordRepository slaRecordRepository;
    private final CaseServiceClient caseClient;
    private final NotificationServiceClient notificationClient;

    @Transactional
    public void initLifecycle(Long caseId, String mode, String caseType, List<ManualStageRequest> manualStages) {
        try { caseClient.setCaseType(caseId, caseType); } catch (Exception e) {
            log.warn("Failed to set case type via case-service: {}", e.getMessage());
        }
        if ("manual".equalsIgnoreCase(mode)) {
            if (manualStages == null || manualStages.isEmpty())
                throw new InvalidOperationException("Manual mode requires stages list");
            initManualStages(caseId, manualStages);
        } else {
            List<StageDefinition> stages;
            if ("criminal".equalsIgnoreCase(caseType)) stages = StageTemplate.getCriminalStage();
            else if ("corporate".equalsIgnoreCase(caseType)) stages = StageTemplate.getCorporateStage();
            else stages = StageTemplate.getCivilStage();
            initFromTemplate(caseId, stages);
        }
        log.info("Lifecycle initialized for Case: {} Mode: {} Type: {}", caseId, mode, caseType);
    }

    private void initFromTemplate(Long caseId, List<StageDefinition> stages) {
        List<WorkflowStage> toSave = new ArrayList<>();
        for (StageDefinition stg : stages) {
            toSave.add(WorkflowStage.builder().caseId(caseId).sequenceNumber(stg.getSeqNum())
                .roleResponsible(stg.getRole().toUpperCase()).slaDays(stg.getSlaDays())
                .stageName(stg.getStageName()).startedAt(LocalDateTime.now())
                .active(stg.getSeqNum() == 1).build());
        }
        workflowStageRepository.saveAll(toSave);
        workflowStageRepository.flush();
        WorkflowStage first = workflowStageRepository.findByCaseIdAndSequenceNumber(caseId, 1)
            .orElseThrow(() -> new ResourceNotFoundException("First stage not found after save"));
        slaRecordRepository.save(SLARecord.builder().caseId(caseId).stageId(first.getStageId())
            .startDate(LocalDate.now()).status(SLARecord.SLAStatus.ON_TIME)
            .slaDays(first.getSlaDays()).breachNotified(false).build());
    }

    private void initManualStages(Long caseId, List<ManualStageRequest> manualStages) {
        List<WorkflowStage> toSave = new ArrayList<>();
        Set<Integer> seqSet = new HashSet<>();
        for (ManualStageRequest m : manualStages) {
            if (m.getSequenceNumber() <= 0) throw new IllegalArgumentException("Sequence number must be >= 1");
            if (!seqSet.add(m.getSequenceNumber())) throw new IllegalArgumentException("Duplicate sequence number");
            if (m.getSlaDays() <= 0) throw new IllegalArgumentException("SLA days must be >= 1");
            toSave.add(WorkflowStage.builder().caseId(caseId).sequenceNumber(m.getSequenceNumber())
                .roleResponsible(m.getRoleResponsible().toUpperCase()).slaDays(m.getSlaDays())
                .stageName(m.getStageName()).startedAt(LocalDateTime.now())
                .active(m.getSequenceNumber() == 1).build());
        }
        toSave.sort(Comparator.comparingInt(WorkflowStage::getSequenceNumber));
        workflowStageRepository.saveAll(toSave);
        workflowStageRepository.flush();
        WorkflowStage first = workflowStageRepository.findByCaseIdAndSequenceNumber(caseId, 1)
            .orElseThrow(() -> new ResourceNotFoundException("First stage not found after save"));
        slaRecordRepository.save(SLARecord.builder().caseId(caseId).stageId(first.getStageId())
            .startDate(LocalDate.now()).status(SLARecord.SLAStatus.ON_TIME)
            .slaDays(first.getSlaDays()).breachNotified(false).build());
    }

    public void advanceWorkflow(Long caseId) {
        WorkflowStage current = workflowStageRepository.findByCaseIdAndActiveTrue(caseId).orElse(null);
        if (current == null) { log.warn("No active workflow stage found for case: {}", caseId); return; }
        current.setActive(false); current.setCompletedAt(LocalDateTime.now());
        workflowStageRepository.save(current);
        SLARecord currentSla = slaRecordRepository.findByStageId(current.getStageId()).orElse(null);
        if (currentSla != null) {
            currentSla.setEndDate(LocalDate.now());
            long elapsed = ChronoUnit.DAYS.between(currentSla.getStartDate(), LocalDate.now());
            if (currentSla.getStatus() != SLARecord.SLAStatus.BREACHED)
                currentSla.setStatus(elapsed <= currentSla.getSlaDays() ? SLARecord.SLAStatus.ON_TIME : SLARecord.SLAStatus.BREACHED);
            slaRecordRepository.save(currentSla);
        }
        int nextSeq = current.getSequenceNumber() + 1;
        Optional<WorkflowStage> next = workflowStageRepository.findByCaseIdAndSequenceNumber(caseId, nextSeq);
        if (next.isPresent()) {
            WorkflowStage n = next.get();
            n.setActive(true); n.setStartedAt(LocalDateTime.now());
            workflowStageRepository.save(n);
            slaRecordRepository.save(SLARecord.builder().caseId(caseId).stageId(n.getStageId())
                .startDate(LocalDate.now()).status(SLARecord.SLAStatus.ON_TIME)
                .slaDays(n.getSlaDays()).breachNotified(false).build());
        } else { log.info("Workflow completed for Case: {}", caseId); }
        log.info("Workflow advanced for Case: {} -> Stage {}", caseId, nextSeq);
    }

    public String runManualSLACheck() {
        List<SLARecord> active = slaRecordRepository.findAll().stream().filter(s -> s.getEndDate() == null).toList();
        int breachCount = 0;
        for (SLARecord sla : active) {
            long elapsed = ChronoUnit.DAYS.between(sla.getStartDate(), LocalDate.now());
            if (elapsed > sla.getSlaDays() && sla.getStatus() != SLARecord.SLAStatus.BREACHED) {
                sla.setStatus(SLARecord.SLAStatus.BREACHED);
                sla.setBreachNotified(true);
                slaRecordRepository.save(sla);
                breachCount++;
            }
        }
        return "SLA check completed. Breaches found: " + breachCount + " out of " + active.size() + " active records.";
    }

    public List<WorkflowStageResponse> getStagesByCaseId(Long caseId) {
        return workflowStageRepository.findByCaseIdOrderBySequenceNumber(caseId).stream().map(this::mapToStageResponse).toList();
    }
    public WorkflowStageResponse getCurrentStage(Long caseId) {
        return mapToStageResponse(workflowStageRepository.findByCaseIdAndActiveTrue(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("No active stage found for case: " + caseId)));
    }
    public List<SLARecordResponse> getSLARecordsByCaseId(Long caseId) { return slaRecordRepository.findByCaseId(caseId).stream().map(this::mapToSLAResponse).toList(); }
    public List<SLARecordResponse> getAllBreachedSLAs() { return slaRecordRepository.findByStatus(SLARecord.SLAStatus.BREACHED).stream().map(this::mapToSLAResponse).toList(); }
    public List<SLARecordResponse> getAllActiveSLAs() { return slaRecordRepository.findAll().stream().filter(s -> s.getEndDate() == null).map(this::mapToSLAResponse).toList(); }

    private WorkflowStageResponse mapToStageResponse(WorkflowStage s) {
        WorkflowStageResponse r = new WorkflowStageResponse();
        r.setStageId(s.getStageId()); r.setCaseId(s.getCaseId());
        r.setSequenceNumber(s.getSequenceNumber()); r.setRoleResponsible(s.getRoleResponsible());
        r.setSlaDays(s.getSlaDays()); r.setStageName(s.getStageName());
        r.setStartedAt(s.getStartedAt()); r.setCompletedAt(s.getCompletedAt());
        r.setActive(s.getActive()); return r;
    }
    private SLARecordResponse mapToSLAResponse(SLARecord s) {
        SLARecordResponse r = new SLARecordResponse();
        r.setSlaRecordId(s.getSlaRecordId()); r.setCaseId(s.getCaseId());
        r.setStageId(s.getStageId()); r.setStartDate(s.getStartDate());
        r.setEndDate(s.getEndDate()); r.setStatus(s.getStatus());
        r.setSlaDays(s.getSlaDays()); r.setBreachNotified(s.getBreachNotified());
        LocalDate end = s.getEndDate() != null ? s.getEndDate() : LocalDate.now();
        long elapsed = ChronoUnit.DAYS.between(s.getStartDate(), end);
        r.setDaysElapsed(elapsed); r.setDaysRemaining(s.getSlaDays() - elapsed);
        return r;
    }
}
