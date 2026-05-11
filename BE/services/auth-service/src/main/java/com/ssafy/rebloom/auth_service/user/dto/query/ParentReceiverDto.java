package com.ssafy.rebloom.auth_service.user.dto.query;

import java.util.UUID;

public record ParentReceiverDto (
    UUID parentId,
    UUID childrenId,
    String childrenName
){

}
