package com.caseflow.workflow.service;

import com.caseflow.workflow.client.*;
import com.caseflow.workflow.dto.*;
import com.caseflow.workflow.entity.*;
import com.caseflow.workflow.exception.*;
import com.caseflow.workflow.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {
    @Mock private WorkflowStageRepository workflowStageRepository;
    @Mock private SLARecordRepository slaRecordRepository;
    @Mock private CaseServiceClient caseClient;
    @Mock private NotificationServiceClient notificationClient;
    @InjectMocks private WorkflowService workflowService;

    @Test void getStagesByCaseId_returnsList() {
        WorkflowStage stage = WorkflowStage.builder().stageId(1L).caseId(1L).sequenceNumber(1)
            .roleResponsible("CLERK").slaDays(7).stageName("Intake")
            .startedAt(LocalDateTime.now()).active(true).build();
        when(workflowStageRepository.findByCaseIdOrderBySequenceNumber(1L)).thenReturn(List.of(stage));
        List<WorkflowStageResponse> result = workflowService.getStagesByCaseId(1L);
        assertEquals(1, result.size());
        assertEquals("Intake", result.get(0).getStageName());
    }

    @Test void getCurrentStage_notFound_throws() {
        when(workflowStageRepository.findByCaseIdAndActiveTrue(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> workflowService.getCurrentStage(99L));
    }

    @Test void getAllBreachedSLAs_empty() {
        when(slaRecordRepository.findByStatus(SLARecord.SLAStatus.BREACHED)).thenReturn(List.of());
        assertEquals(0, workflowService.getAllBreachedSLAs().size());
    }
}
