package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.Parent;
import com.ssafy.rebloom.auth_service.user.repository.query.ParentQueryRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentRepository extends JpaRepository<Parent, UUID>, ParentQueryRepository {

    Optional<Parent> findByEmail(String email);
}
