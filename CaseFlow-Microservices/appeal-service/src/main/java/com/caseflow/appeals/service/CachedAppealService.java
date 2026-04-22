package com.caseflow.appeals.service;

import com.caseflow.appeals.entity.Appeal;
import com.caseflow.appeals.entity.Review;
import com.caseflow.appeals.repository.AppealRepository;
import com.caseflow.appeals.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CachedAppealService {

    private final AppealRepository appealRepository;
    private final ReviewRepository reviewRepository;

    public Page<Appeal> getAllAppealsPaginated(Pageable pageable) {
        return appealRepository.findAll(pageable);
    }

    public Page<Review> getAllReviewsPaginated(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }
}
