package com.ssafy.rebloom.auth_service.user.repository;

import java.util.UUID;

public interface ParentConnectedChildProjection {

    UUID getChildrenId();

    String getName();

    String getEmail();

    String getBirth();
}
