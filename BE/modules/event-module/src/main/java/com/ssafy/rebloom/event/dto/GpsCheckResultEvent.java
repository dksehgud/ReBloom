package com.ssafy.rebloom.event.dto;

import java.util.UUID;

public record GpsCheckResultEvent(
    UUID childrenId,
    UUID parentId,
    Boolean isSame
) {
}