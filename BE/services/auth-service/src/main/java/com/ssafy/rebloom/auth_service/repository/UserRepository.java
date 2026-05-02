package com.ssafy.rebloom.auth_service.repository;

import com.ssafy.rebloom.auth_service.domain.entity.User;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
}