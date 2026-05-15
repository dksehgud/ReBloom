package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ParentCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParentCounselorRelationRepository extends JpaRepository<ParentCounselorRelation, Long> {

    @Query("""
        SELECT pcr
        FROM ParentCounselorRelation pcr
        JOIN FETCH pcr.counselor
        WHERE pcr.parent.id = :parentId
          AND pcr.relationStatus IN :relationStatuses
        ORDER BY pcr.createdAt DESC
        """)
    List<ParentCounselorRelation> findAllByParentIdAndRelationStatusIn(
        @Param("parentId") UUID parentId,
        @Param("relationStatuses") Collection<RelationStatus> relationStatuses
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
        JOIN FETCH pcr.counselor
        WHERE pcr.parent.id = :parentId
          AND pcr.counselor.email = :counselorEmail
          AND pcr.relationStatus IN :relationStatuses
        """)
    Optional<ParentCounselorRelation> findByParentIdAndCounselorEmailAndRelationStatusIn(
        @Param("parentId") UUID parentId,
        @Param("counselorEmail") String counselorEmail,
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
