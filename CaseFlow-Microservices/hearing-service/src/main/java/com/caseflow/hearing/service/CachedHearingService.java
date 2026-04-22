package com.caseflow.hearing.service;

import com.caseflow.hearing.entity.Hearing;
import com.caseflow.hearing.entity.Schedule;
import com.caseflow.hearing.repository.HearingRepository;
import com.caseflow.hearing.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CachedHearingService {

    private final HearingRepository hearingRepository;
    private final ScheduleRepository scheduleRepository;

    public Page<Hearing> getAllHearingsPaginated(Pageable pageable) {
        return hearingRepository.findAll(pageable);
    }

    public Page<Schedule> getAllSchedulesPaginated(Pageable pageable) {
        return scheduleRepository.findAll(pageable);
    }
}
