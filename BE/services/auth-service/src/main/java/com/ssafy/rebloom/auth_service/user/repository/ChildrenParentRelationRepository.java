package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ChildrenParentRelation;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;

import java.util.Optional;
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
        @Param("childrenId") UUID childrenId
    );

    @Query(value = """
        SELECT c.id AS "childrenId",
               u.name AS "name",
               u.email AS "email",
               c.birth AS "birth"
        FROM children_parent_relations cpr
        JOIN childrens c
          ON c.id = cpr.children_id
        JOIN users u
          ON u.id = c.id
        WHERE cpr.parent_id = :parentId
          AND cpr.relation_status = 'ACTIVE'
        LIMIT 1
        """, nativeQuery = true)
    Optional<ParentConnectedChildProjection> findActiveChildByParentId(
        @Param("parentId") UUID parentId
    );

    @Query(value = """
        SELECT p.id AS "parentId",
               u.name AS "name",
               u.email AS "email"
        FROM children_parent_relations cpr
        JOIN parents p
          ON p.id = cpr.parent_id
        JOIN users u
          ON u.id = p.id
        WHERE cpr.children_id = :childrenId
          AND cpr.relation_status = 'ACTIVE'
        LIMIT 1
        """, nativeQuery = true)
    Optional<ChildConnectedParentProjection> findActiveParentByChildrenId(
        @Param("childrenId") UUID childrenId
    );

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM children_parent_relations
            WHERE parent_id = :parentId
              AND children_id = :childrenId
        )
        """, nativeQuery = true)
    boolean existsRelation(
        @Param("parentId") UUID parentId,
        @Param("childrenId") UUID childrenId
    );

    @Query("""
        SELECT cpr
        FROM ChildrenParentRelation cpr
        JOIN FETCH cpr.children
        WHERE cpr.parent.id = :parentId
          AND cpr.relationStatus = :relationStatus
        """)
    Optional<ChildrenParentRelation> findFirstByParentIdAndRelationStatus(
        @Param("parentId") UUID parentId,
        @Param("relationStatus") RelationStatus relationStatus
    );
}
