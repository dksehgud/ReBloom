package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenCounselorRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;

import java.time.LocalDateTime;
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
}
