package com.ssafy.rebloom.auth_service.repository;

import com.ssafy.rebloom.auth_service.domain.entity.Parent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentRepository extends JpaRepository<Parent, UUID> {
}