package com.caseflow.hearing.repository;
import com.caseflow.hearing.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByJudgeId(Long judgeId);
    List<Schedule> findByJudgeIdAndAvailable(Long judgeId, Boolean available);
    List<Schedule> findByJudgeIdAndScheduleDate(Long judgeId, LocalDate date);
    Optional<Schedule> findByJudgeIdAndScheduleDateAndTimeSlot(Long judgeId, LocalDate date, String timeSlot);
    Optional<Schedule> findByHearingId(Long hearingId);
}
