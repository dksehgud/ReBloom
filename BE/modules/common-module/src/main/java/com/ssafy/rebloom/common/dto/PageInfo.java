package com.ssafy.rebloom.common.dto;

import org.springframework.data.domain.Page;

public record PageInfo(
    Integer number,
    Integer size,
    Long totalElements,
    Integer totalPages
) {

    public static PageInfo of(Page<?> page) {
        return new PageInfo(
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}

