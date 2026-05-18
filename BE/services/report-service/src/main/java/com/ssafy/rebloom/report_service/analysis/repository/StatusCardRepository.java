package com.ssafy.rebloom.report_service.analysis.repository;

import com.ssafy.rebloom.report_service.analysis.domain.entity.StatusCard;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusCardRepository extends JpaRepository<StatusCard, Long> {

    Optional<StatusCard> findByUserIdAndDate(UUID userId, LocalDate date);
}