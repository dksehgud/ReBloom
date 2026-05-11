package com.ssafy.rebloom.biometric_service.repository.query.impl;

import static com.ssafy.rebloom.biometric_service.domain.entity.QSleep.sleep;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.biometric_service.dto.query.SleepEfficiencyDto;
import com.ssafy.rebloom.biometric_service.dto.query.SleepScoreDto;
import com.ssafy.rebloom.biometric_service.repository.query.SleepQueryRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class SleepQueryRepositoryImpl implements SleepQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public List<SleepScoreDto> findSleepScoresByRange(UUID childrenId, LocalDateTime from,
        LocalDateTime to) {
        return jpaQueryFactory
            .select(Projections.constructor(
                SleepScoreDto.class,
                sleep.id.wakeup,
                sleep.sleepScore
            ))
            .from(sleep)
            .where(
                sleep.id.userId.eq(childrenId),
                sleep.id.wakeup.goe(from),
                sleep.id.wakeup.lt(to),
                sleep.isMainSleep.isTrue()
            )
            .orderBy(sleep.id.wakeup.asc())
            .fetch();
    }

    public List<SleepEfficiencyDto> findSleepEfficienciesByRange(
        UUID childrenId,
        LocalDateTime from,
        LocalDateTime to
    ) {
        return jpaQueryFactory
            .select(Projections.constructor(
                SleepEfficiencyDto.class,
                sleep.id.wakeup,
                sleep.sleepEfficiency
            ))
            .from(sleep)
            .where(
                sleep.id.userId.eq(childrenId),
                sleep.id.wakeup.goe(from),
                sleep.id.wakeup.lt(to),
                sleep.isMainSleep.isTrue()
            )
            .orderBy(sleep.id.wakeup.asc())
            .fetch();
    }
}
