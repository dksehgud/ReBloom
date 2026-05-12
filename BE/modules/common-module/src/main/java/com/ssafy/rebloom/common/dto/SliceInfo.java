package com.ssafy.rebloom.common.dto;

import org.springframework.data.domain.Slice;

public record SliceInfo(
    Integer number,
    Integer size,
    Boolean hasNext,
    Boolean hasPrevious,
    Boolean first,
    Boolean last,
    Integer numberOfElements
) {
    public static SliceInfo of(Slice<?> slice) {
        return new SliceInfo(
            slice.getNumber(),
            slice.getSize(),
            slice.hasNext(),
            slice.hasPrevious(),
            slice.isFirst(),
            slice.isLast(),
            slice.getNumberOfElements()
        );
    }
}
