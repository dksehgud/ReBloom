package com.ssafy.rebloom.event.dto;

import java.util.UUID;

public record GpsCheckRequestedEvent(
    UUID childrenId,
    UUID parentId
) {
}