package com.ssafy.rebloom.security.dto;

import java.util.UUID;

public record AuthUserInfo(UUID id, String role) {
}