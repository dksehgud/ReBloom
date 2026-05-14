package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
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
               c.birth AS "birth",
               c.gender AS "gender",
               pu.name AS "parentName",
               CASE
                   WHEN ccr.ended_at IS NULL THEN 'IN_PROGRESS'
                   ELSE 'ENDED'
               END AS "counselingStatus"
        FROM children_counselor_relations ccr
        JOIN childrens c
          ON c.id = ccr.children_id
        JOIN users u
          ON u.id = c.id
        LEFT JOIN children_parent_relations cpr
          ON cpr.children_id = c.id
         AND cpr.relation_status = 'ACTIVE'
        LEFT JOIN users pu
          ON pu.id = cpr.parent_id
        WHERE ccr.counselor_id = :counselorId
          AND ccr.relation_status = 'ACTIVE'
        ORDER BY u.name ASC
        """, nativeQuery = true)
    List<CounselorChildProjection> findChildrenByCounselorId(
        @Param("counselorId") UUID counselorId
    );

    boolean existsByCounselor_IdAndChildren_IdAndRelationStatus(
        UUID counselorId,
        UUID childrenId,
        RelationStatus relationStatus
    );

    @EntityGraph(attributePaths = "counselor")
    Optional<ChildrenCounselorRelation> findFirstByChildren_IdAndRelationStatus(
        UUID childrenId,
        RelationStatus relationStatus
    );
}
