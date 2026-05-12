package com.ssafy.rebloom.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import org.springframework.data.domain.Slice;

public record SliceResponseDto<T>(
    SliceInfo slice,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    SortInfo sort,
    List<T> contents
) {
    public static <T> SliceResponseDto<T> from(Slice<T> slice) {
        return new SliceResponseDto<>(
            SliceInfo.of(slice),
            SortInfo.of(slice),
            slice.getContent()
        );
    }
}