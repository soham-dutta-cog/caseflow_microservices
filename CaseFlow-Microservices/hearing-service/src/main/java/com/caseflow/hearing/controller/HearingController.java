package com.caseflow.hearing.controller;

import com.caseflow.hearing.dto.*;
import com.caseflow.hearing.entity.Hearing;
import com.caseflow.hearing.service.HearingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api/hearings") @RequiredArgsConstructor
@Tag(name = "Hearing & Scheduling", description = "Manage hearings and judge calendar")
public class HearingController {
    private final HearingService hearingService;

    @PostMapping("/schedule/slots") public ResponseEntity<ScheduleResponse> addSlot(@Valid @RequestBody ScheduleRequest request) { return ResponseEntity.ok(hearingService.addScheduleSlot(request)); }
    @GetMapping("/schedule/judge/{judgeId}/available") public ResponseEntity<List<ScheduleResponse>> getAvailableSlots(@PathVariable Long judgeId) { return ResponseEntity.ok(hearingService.getAvailableSlotsByJudge(judgeId)); }
    @GetMapping("/schedule/judge/{judgeId}/date/{date}") public ResponseEntity<List<ScheduleResponse>> getSlotsByDate(@PathVariable Long judgeId, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) { return ResponseEntity.ok(hearingService.getSlotsByJudgeAndDate(judgeId, date)); }
    @GetMapping("/schedule/judge/{judgeId}/all") public ResponseEntity<List<ScheduleResponse>> getAllSlots(@PathVariable Long judgeId) { return ResponseEntity.ok(hearingService.getAllSlotsByJudge(judgeId)); }
    @PostMapping("/schedule") public ResponseEntity<HearingResponse> scheduleHearing(@Valid @RequestBody HearingRequest request) { return ResponseEntity.ok(hearingService.scheduleHearing(request)); }
    @PatchMapping("/{hearingId}/reschedule") public ResponseEntity<HearingResponse> rescheduleHearing(@PathVariable Long hearingId, @Valid @RequestBody RescheduleRequest request) { return ResponseEntity.ok(hearingService.rescheduleHearing(hearingId, request)); }
    @PatchMapping("/{hearingId}/complete") public ResponseEntity<HearingResponse> completeHearing(@PathVariable Long hearingId, @Valid @RequestBody CompleteHearingRequest request) { return ResponseEntity.ok(hearingService.completeHearing(hearingId, request)); }
    @GetMapping("/{hearingId}") public ResponseEntity<HearingResponse> getHearingById(@PathVariable Long hearingId) { return ResponseEntity.ok(hearingService.getHearingById(hearingId)); }
    @GetMapping public ResponseEntity<List<HearingResponse>> getAllHearings() { return ResponseEntity.ok(hearingService.getAllHearings()); }
    @GetMapping("/case/{caseId}") public ResponseEntity<List<HearingResponse>> getHearingsByCase(@PathVariable Long caseId) { return ResponseEntity.ok(hearingService.getHearingsByCase(caseId)); }
    @GetMapping("/judge/{judgeId}") public ResponseEntity<List<HearingResponse>> getHearingsByJudge(@PathVariable Long judgeId) { return ResponseEntity.ok(hearingService.getHearingsByJudge(judgeId)); }
    @GetMapping("/status/{status}") public ResponseEntity<List<HearingResponse>> getHearingsByStatus(@PathVariable Hearing.HearingStatus status) { return ResponseEntity.ok(hearingService.getHearingsByStatus(status)); }
}
