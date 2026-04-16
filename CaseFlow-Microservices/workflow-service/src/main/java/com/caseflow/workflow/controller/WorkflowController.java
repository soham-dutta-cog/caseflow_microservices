package com.caseflow.workflow.controller;

import com.caseflow.workflow.dto.*;
import com.caseflow.workflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequiredArgsConstructor
@Tag(name = "Case Lifecycle & Workflow", description = "Workflow stages, SLA tracking, lifecycle management")
public class WorkflowController {
    private final WorkflowService workflowService;

    @PostMapping("/api/workflow/lifecycle/{caseId}/initialize")
    public ResponseEntity<Map<String, Object>> initLifecycle(@PathVariable Long caseId,
            @Valid @RequestBody(required = false) LifecycleInitRequest request) {
        if (request == null) request = new LifecycleInitRequest();
        workflowService.initLifecycle(caseId, request.getMode(), request.getCaseType(), request.getStages());
        return ResponseEntity.ok(Map.of("message", "Lifecycle initialized for Case " + caseId,
            "mode", request.getMode(), "caseType", request.getCaseType()));
    }

    @GetMapping("/api/workflow/cases/{caseId}/stages")
    public ResponseEntity<List<WorkflowStageResponse>> getStagesByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(workflowService.getStagesByCaseId(caseId));
    }

    @GetMapping("/api/workflow/cases/{caseId}/stages/current")
    public ResponseEntity<WorkflowStageResponse> getCurrentStage(@PathVariable Long caseId) {
        return ResponseEntity.ok(workflowService.getCurrentStage(caseId));
    }

    @PostMapping("/api/workflow/cases/{caseId}/advance")
    public ResponseEntity<Map<String, String>> advanceWorkflow(@PathVariable Long caseId) {
        workflowService.advanceWorkflow(caseId);
        return ResponseEntity.ok(Map.of("message", "Workflow advanced for Case: " + caseId));
    }

    @GetMapping("/api/workflow/cases/{caseId}/sla")
    public ResponseEntity<List<SLARecordResponse>> getSLAByCase(@PathVariable Long caseId) {
        return ResponseEntity.ok(workflowService.getSLARecordsByCaseId(caseId));
    }

    @GetMapping("/api/workflow/sla/breached")
    public ResponseEntity<List<SLARecordResponse>> getAllBreached() {
        return ResponseEntity.ok(workflowService.getAllBreachedSLAs());
    }

    @GetMapping("/api/workflow/sla/active")
    public ResponseEntity<List<SLARecordResponse>> getAllActive() {
        return ResponseEntity.ok(workflowService.getAllActiveSLAs());
    }

    @PostMapping("/api/workflow/sla/check")
    public ResponseEntity<String> runSLACheck() {
        return ResponseEntity.ok(workflowService.runManualSLACheck());
    }
}
