package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.domain.entity.SocialUser;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocialUserRepository extends JpaRepository<SocialUser, UUID> {
}