package com.ssafy.rebloom.auth_service.device.domain.entity;

import com.ssafy.rebloom.auth_service.device.domain.enums.DeviceType;
import com.ssafy.rebloom.common.entity.BaseTime;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Builder
@Table(name = "devices")
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class Device extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "serial_number", nullable = false)
    private String serialNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    private DeviceType deviceType;

    @NotNull
    @Column(name = "children_id", nullable = false)
    private UUID childrenId;

    public void assignToChild(UUID childrenId) {
        this.childrenId = childrenId;
    }
}
