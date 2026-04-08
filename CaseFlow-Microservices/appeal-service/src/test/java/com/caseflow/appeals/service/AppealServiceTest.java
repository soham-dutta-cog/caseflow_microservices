package com.caseflow.appeals.service;

import com.caseflow.appeals.client.*;
import com.caseflow.appeals.entity.*;
import com.caseflow.appeals.exception.*;
import com.caseflow.appeals.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppealServiceTest {
    @Mock private AppealRepository appealRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private CaseServiceClient caseClient;
    @Mock private WorkflowServiceClient workflowClient;
    @Mock private NotificationServiceClient notificationClient;
    @InjectMocks private AppealService appealService;

    @Test void getAppealById_notFound_throws() {
        when(appealRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> appealService.getAppealById(99L));
    }

    @Test void getAppealById_found() {
        Appeal a = Appeal.builder().appealId(1L).caseId(1L).filedByUserId(1L)
            .filedDate(LocalDate.now()).reason("test").status(Appeal.AppealStatus.SUBMITTED).build();
        when(appealRepository.findById(1L)).thenReturn(Optional.of(a));
        assertEquals(1L, appealService.getAppealById(1L).getAppealId());
    }

    @Test void getAppealsByCase_empty() {
        when(appealRepository.findByCaseId(1L)).thenReturn(List.of());
        assertEquals(0, appealService.getAppealsByCase(1L).size());
    }
}
