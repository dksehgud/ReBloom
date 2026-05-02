package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.domain.entity.Children;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChildrenRepository extends JpaRepository<Children, UUID> {
}