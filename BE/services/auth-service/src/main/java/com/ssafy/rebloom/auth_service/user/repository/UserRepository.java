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

    @Query(value = """
        SELECT id, name
        FROM users
        WHERE role = 'CHILDREN'
          AND status = 'ACTIVE'
        ORDER BY id ASC
        """, nativeQuery = true)
    List<Object[]> findActiveChildrenRows();
}
