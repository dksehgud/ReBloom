package com.ssafy.rebloom.auth_service.repository;

import com.ssafy.rebloom.auth_service.domain.entity.ParentCounselorRelation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentCounselorRelationRepository extends JpaRepository<ParentCounselorRelation, Long> {
}