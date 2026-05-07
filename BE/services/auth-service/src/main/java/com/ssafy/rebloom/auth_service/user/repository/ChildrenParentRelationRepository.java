package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenParentRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChildrenParentRelationRepository extends JpaRepository<ChildrenParentRelation, Long> {

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM children_parent_relations
            WHERE parent_id = :parentId
              AND children_id = :childrenId
              AND relation_status = 'ACTIVE'
        )
        """, nativeQuery = true)
    boolean existsActiveRelation(
        @Param("parentId") UUID parentId,
        @Param("childrenId") UUID childrenId,
        @Param("relationStatus") RelationStatus relationStatus
    );
}
