package com.ssafy.rebloom.auth_service.repository;

import com.ssafy.rebloom.auth_service.domain.entity.Counselor;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CounselorRepository extends JpaRepository<Counselor, UUID> {
}