package com.ssafy.rebloom.auth_service.user.repository;

import com.ssafy.rebloom.auth_service.domain.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, Long> {
}
