package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.user.domain.entity.User;
import com.ssafy.rebloom.auth_service.user.domain.enums.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    List<User> findAllByEmailAndRole(String email, UserRole userRole);

    @Query("""
    SELECT u
    FROM User u
    WHERE u.role = com.ssafy.rebloom.auth_service.user.domain.enums.UserRole.CHILDREN
      AND u.status = com.ssafy.rebloom.auth_service.user.domain.enums.UserStatus.ACTIVE
    ORDER BY u.id ASC
    """)
    List<User> findActiveChildren();
}
