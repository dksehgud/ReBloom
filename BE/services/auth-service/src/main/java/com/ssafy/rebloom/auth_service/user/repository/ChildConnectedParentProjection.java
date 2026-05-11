package com.ssafy.rebloom.auth_service.user.repository;

import java.util.UUID;

public interface ChildConnectedParentProjection {

    UUID getParentId();

    String getName();

    String getEmail();
}
