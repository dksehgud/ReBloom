package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ParentCounselorRelation;
import com.ssafy.rebloom.auth_service.user.dto.response.ParentCounselorResponseDto;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParentCounselorRelationRepository extends JpaRepository<ParentCounselorRelation, Long> {

    @Query(value = """
        SELECT pcr.counselor_id AS "counselorId",
               u.name AS "name",
               u.email AS "email"
        FROM parent_counselor_relations pcr
        JOIN users u
          ON u.id = pcr.counselor_id
        WHERE pcr.parent_id = :parentId
          AND pcr.relation_status = 'ACTIVE'
        """, nativeQuery = true)
    Optional<ParentCounselorResponseDto> findByParentId(
        @Param("parentId") UUID parentId
    );
}
