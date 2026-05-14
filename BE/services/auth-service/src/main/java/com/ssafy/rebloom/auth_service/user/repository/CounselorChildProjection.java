package com.ssafy.rebloom.auth_service.user.repository;

import java.util.UUID;

public interface CounselorChildProjection {

    UUID getChildrenId();

    String getName();

    String getBirth();

    String getGender();

    String getParentName();

    String getCounselingStatus();
}
