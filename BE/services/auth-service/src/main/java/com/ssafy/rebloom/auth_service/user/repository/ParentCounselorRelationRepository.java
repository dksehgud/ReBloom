package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ParentCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentCounselorResponseDto;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParentCounselorRelationRepository extends JpaRepository<ParentCounselorRelation, Long> {

    @Query(value = """
        SELECT pcr.counselor_id AS "counselorId",
               u.name AS "name",
               u.email AS "email",
               pcr.relation_status AS "relationStatus"
        FROM parent_counselor_relations pcr
        JOIN users u
          ON u.id = pcr.counselor_id
        WHERE pcr.parent_id = :parentId
          AND pcr.relation_status IN ('ACTIVE', 'PENDING')
        ORDER BY
          CASE pcr.relation_status
            WHEN 'ACTIVE' THEN 1
            WHEN 'PENDING' THEN 2
            ELSE 3
          END,
          pcr.created_at DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<ParentCounselorResponseDto> findByParentId(
        @Param("parentId") UUID parentId
    );

    @Query("""
        SELECT COUNT(pcr) > 0
        FROM ParentCounselorRelation pcr
        WHERE pcr.parent.id = :parentId
          AND pcr.relationStatus IN :relationStatuses
        """)
    boolean existsByParentIdAndRelationStatusIn(
        @Param("parentId") UUID parentId,
        @Param("relationStatuses") Collection<RelationStatus> relationStatuses
    );

    @Query("""
        SELECT pcr
        FROM ParentCounselorRelation pcr
        WHERE pcr.parent.id = :parentId
          AND pcr.counselor.id = :counselorId
          AND pcr.relationStatus IN :relationStatuses
        """)
    Optional<ParentCounselorRelation> findByParentIdAndCounselorIdAndRelationStatusIn(
        @Param("parentId") UUID parentId,
        @Param("counselorId") UUID counselorId,
        @Param("relationStatuses") Collection<RelationStatus> relationStatuses
    );

    @Query("""
        SELECT pcr
        FROM ParentCounselorRelation pcr
        JOIN FETCH pcr.parent
        WHERE pcr.counselor.id = :counselorId
          AND pcr.relationStatus IN :relationStatuses
        ORDER BY pcr.createdAt DESC
        """)
    List<ParentCounselorRelation> findAllByCounselorIdAndRelationStatusIn(
        @Param("counselorId") UUID counselorId,
        @Param("relationStatuses") Collection<RelationStatus> relationStatuses
    );
}
