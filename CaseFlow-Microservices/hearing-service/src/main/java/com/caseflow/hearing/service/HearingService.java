package com.caseflow.hearing.service;

import com.caseflow.hearing.client.*;
import com.caseflow.hearing.dto.*;
import com.caseflow.hearing.entity.*;
import com.caseflow.hearing.exception.*;
import com.caseflow.hearing.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service @RequiredArgsConstructor @Slf4j
public class HearingService {
    private final HearingRepository hearingRepository;
    private final ScheduleRepository scheduleRepository;
    private final CaseServiceClient caseClient;
    private final IamServiceClient iamClient;
    private final WorkflowServiceClient workflowClient;
    private final NotificationServiceClient notificationClient;

    public ScheduleResponse addScheduleSlot(ScheduleRequest request) {
        scheduleRepository.findByJudgeIdAndScheduleDateAndTimeSlot(
            request.getJudgeId(), request.getScheduleDate(), request.getTimeSlot())
            .ifPresent(s -> { throw new InvalidOperationException("Slot already exists"); });
        Schedule slot = Schedule.builder().judgeId(request.getJudgeId())
            .scheduleDate(request.getScheduleDate()).timeSlot(request.getTimeSlot())
            .available(true).build();
        return mapToScheduleResponse(scheduleRepository.save(slot));
    }

    public HearingResponse scheduleHearing(HearingRequest request) {
        Schedule slot = scheduleRepository.findById(request.getScheduleId())
            .orElseThrow(() -> new ResourceNotFoundException("Schedule slot not found: " + request.getScheduleId()));
        if (!slot.getAvailable()) throw new InvalidOperationException("Schedule slot is already booked");

        Hearing hearing = Hearing.builder().caseId(request.getCaseId()).judgeId(request.getJudgeId())
            .hearingDate(request.getHearingDate()).hearingTime(request.getHearingTime())
            .status(Hearing.HearingStatus.SCHEDULED).scheduledBy(request.getScheduledBy()).build();
        Hearing saved = hearingRepository.save(hearing);
        slot.setAvailable(false); slot.setHearingId(saved.getHearingId());
        scheduleRepository.save(slot);

        // Notify the judge assigned to the hearing
        sendNotification(saved.getJudgeId(), saved.getCaseId(),
            "Hearing #" + saved.getHearingId() + " scheduled for case #" + saved.getCaseId()
            + " on " + saved.getHearingDate() + " at " + saved.getHearingTime() + ".", "HEARING");

        return mapToHearingResponse(saved);
    }

    public HearingResponse rescheduleHearing(Long hearingId, RescheduleRequest request) {
        Hearing hearing = hearingRepository.findById(hearingId)
            .orElseThrow(() -> new ResourceNotFoundException("Hearing not found: " + hearingId));
        if (hearing.getStatus() == Hearing.HearingStatus.COMPLETED)
            throw new InvalidOperationException("Cannot reschedule a COMPLETED hearing");
        Schedule newSlot = scheduleRepository.findById(request.getNewScheduleId())
            .orElseThrow(() -> new ResourceNotFoundException("New schedule slot not found"));
        if (!newSlot.getAvailable()) throw new InvalidOperationException("New slot is already booked");

        scheduleRepository.findByHearingId(hearingId).ifPresent(old -> {
            old.setAvailable(true); old.setHearingId(null); scheduleRepository.save(old);
        });

        hearing.setHearingDate(request.getNewDate()); hearing.setHearingTime(request.getNewTime());
        hearing.setStatus(Hearing.HearingStatus.RESCHEDULED);
        hearing.setRescheduleReason(request.getRescheduleReason());
        Hearing saved = hearingRepository.save(hearing);
        newSlot.setAvailable(false); newSlot.setHearingId(hearingId);
        scheduleRepository.save(newSlot);
        try { caseClient.updateCaseStatusInternal(hearing.getCaseId(), "ADJOURNED"); } catch (Exception e) { log.warn("Failed to update case status: {}", e.getMessage()); }

        // Notify the judge of the rescheduled hearing
        sendNotification(saved.getJudgeId(), saved.getCaseId(),
            "Hearing #" + hearingId + " for case #" + saved.getCaseId()
            + " has been rescheduled to " + saved.getHearingDate() + " at " + saved.getHearingTime()
            + ". Reason: " + saved.getRescheduleReason(), "HEARING");

        return mapToHearingResponse(saved);
    }

    public HearingResponse completeHearing(Long hearingId, CompleteHearingRequest request) {
        Hearing hearing = hearingRepository.findById(hearingId)
            .orElseThrow(() -> new ResourceNotFoundException("Hearing not found: " + hearingId));
        if (hearing.getStatus() == Hearing.HearingStatus.COMPLETED)
            throw new InvalidOperationException("Hearing already COMPLETED");
        if (!hearing.getJudgeId().equals(request.getJudgeId()))
            throw new InvalidOperationException("Judge not assigned to this hearing");
        hearing.setStatus(Hearing.HearingStatus.COMPLETED);
        hearing.setHearingNotes(request.getHearingNotes());
        Hearing saved = hearingRepository.save(hearing);
        scheduleRepository.findByHearingId(hearingId).ifPresent(s -> {
            s.setAvailable(true); s.setHearingId(null); scheduleRepository.save(s);
        });
        try { workflowClient.advanceWorkflow(hearing.getCaseId()); } catch (Exception e) { log.warn("Failed to advance workflow: {}", e.getMessage()); }

        // Notify the judge that the hearing has been completed and their slot is now free
        sendNotification(saved.getJudgeId(), saved.getCaseId(),
            "Hearing #" + hearingId + " for case #" + saved.getCaseId()
            + " has been marked COMPLETED. Workflow advanced.", "HEARING");

        return mapToHearingResponse(saved);
    }

    public HearingResponse getHearingById(Long id) {
        return mapToHearingResponse(hearingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Hearing not found: " + id)));
    }
    public List<HearingResponse> getAllHearings() { return hearingRepository.findAll().stream().map(this::mapToHearingResponse).toList(); }
    public List<HearingResponse> getHearingsByCase(Long id) { return hearingRepository.findByCaseId(id).stream().map(this::mapToHearingResponse).toList(); }
    public List<HearingResponse> getHearingsByJudge(String id) { return hearingRepository.findByJudgeId(id).stream().map(this::mapToHearingResponse).toList(); }
    public List<HearingResponse> getHearingsByStatus(Hearing.HearingStatus s) { return hearingRepository.findByStatus(s).stream().map(this::mapToHearingResponse).toList(); }
    public List<ScheduleResponse> getAvailableSlotsByJudge(String id) { return scheduleRepository.findByJudgeIdAndAvailable(id, true).stream().map(this::mapToScheduleResponse).toList(); }
    public List<ScheduleResponse> getSlotsByJudgeAndDate(String id, java.time.LocalDate d) { return scheduleRepository.findByJudgeIdAndScheduleDate(id, d).stream().map(this::mapToScheduleResponse).toList(); }
    public List<ScheduleResponse> getAllSlotsByJudge(String id) { return scheduleRepository.findByJudgeId(id).stream().map(this::mapToScheduleResponse).toList(); }

    private void sendNotification(String userId, Long caseId, String message, String category) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("userId",   userId);
            req.put("caseId",   caseId);
            req.put("message",  message);
            req.put("category", category);
            notificationClient.sendNotification(req);
        } catch (Exception e) {
            log.warn("Notification failed for case #{}: {}", caseId, e.getMessage());
        }
    }

    private HearingResponse mapToHearingResponse(Hearing h) {
        HearingResponse r = new HearingResponse();
        r.setHearingId(h.getHearingId()); r.setCaseId(h.getCaseId());
        r.setJudgeId(h.getJudgeId()); r.setHearingDate(h.getHearingDate());
        r.setHearingTime(h.getHearingTime()); r.setStatus(h.getStatus());
        r.setScheduledBy(h.getScheduledBy()); r.setRescheduleReason(h.getRescheduleReason());
        r.setHearingNotes(h.getHearingNotes()); return r;
    }
    private ScheduleResponse mapToScheduleResponse(Schedule s) {
        ScheduleResponse r = new ScheduleResponse();
        r.setScheduleId(s.getScheduleId()); r.setJudgeId(s.getJudgeId());
        r.setScheduleDate(s.getScheduleDate()); r.setTimeSlot(s.getTimeSlot());
        r.setAvailable(s.getAvailable()); r.setHearingId(s.getHearingId()); return r;
    }
}
