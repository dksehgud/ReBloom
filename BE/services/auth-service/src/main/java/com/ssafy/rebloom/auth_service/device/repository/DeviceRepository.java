package com.ssafy.rebloom.auth_service.device.repository;

import com.ssafy.rebloom.auth_service.device.domain.entity.Device;
import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    boolean existsBySerialNumber(String serialNumber);

    boolean existsByChildrenIdAndDeviceType(UUID childrenId, DeviceType deviceType);

    Optional<Device> findBySerialNumber(String serialNumber);

    Optional<Device> findByChildrenIdAndDeviceType(UUID childrenId, DeviceType deviceType);

    List<Device> findAllByChildrenId(UUID childrenId);
}
