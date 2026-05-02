package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.domain.entity.ChildrenParentRelation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChildrenParentRelationRepository extends JpaRepository<ChildrenParentRelation, Long> {
}