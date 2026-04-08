package com.caseflow.reporting.service;

import com.caseflow.reporting.entity.Report;
import com.caseflow.reporting.exception.*;
import com.caseflow.reporting.repository.ReportRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock private ReportRepository reportRepository;
    @InjectMocks private ReportServiceImpl reportService;

    @Test void getReportById_notFound_throws() {
        when(reportRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> reportService.getReportById(99L));
    }

    @Test void getReportsByAdmin_empty() {
        when(reportRepository.findByRequestedBy(1L)).thenReturn(List.of());
        assertEquals(0, reportService.getReportsByAdmin(1L).size());
    }
}
