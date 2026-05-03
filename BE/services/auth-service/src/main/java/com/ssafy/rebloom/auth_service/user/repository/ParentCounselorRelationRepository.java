package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.ParentCounselorRelation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentCounselorRelationRepository extends JpaRepository<ParentCounselorRelation, Long> {
}