package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChildrenCounselorRelationRepository extends JpaRepository<ChildrenCounselorRelation, Long> {

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM children_counselor_relations
                WHERE counselor_id = :counselorId
                  AND children_id = :childrenId
                  AND relation_status = 'ACTIVE'
            );
        """, nativeQuery = true)
    boolean existsActiveRelation(
        @Param("counselorId") UUID counselorId,
        @Param("childrenId") UUID childrenId,
        @Param("relationStatus") RelationStatus relationStatus,
        @Param("now") LocalDateTime now
    );

    @Query(value = """
        SELECT c.id AS "childrenId",
               u.name AS "name",
               CASE
                   WHEN ccr.ended_at IS NULL THEN 'IN_PROGRESS'
                   ELSE 'ENDED'
               END AS "counselingStatus"
        FROM children_counselor_relations ccr
        JOIN childrens c
          ON c.id = ccr.children_id
        JOIN users u
          ON u.id = c.id
        WHERE ccr.counselor_id = :counselorId
          AND ccr.relation_status = 'ACTIVE'
        ORDER BY u.name ASC
        """, nativeQuery = true)
    List<CounselorChildProjection> findChildrenByCounselorId(
        @Param("counselorId") UUID counselorId
    );
}
