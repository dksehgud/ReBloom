package com.ssafy.rebloom.auth_service.user.repository.query.impl;


import static com.ssafy.rebloom.auth_service.user.domain.entity.QChildren.children;
import static com.ssafy.rebloom.auth_service.user.domain.entity.QChildrenParentRelation.childrenParentRelation;
import static com.ssafy.rebloom.auth_service.user.domain.entity.QParent.parent;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.rebloom.auth_service.user.domain.enums.RelationStatus;
import com.ssafy.rebloom.auth_service.user.dto.query.ParentReceiverDto;
import com.ssafy.rebloom.auth_service.user.repository.query.ParentQueryRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ParentQueryRepositoryImpl implements ParentQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;
    @Override
    public Optional<ParentReceiverDto> findParentReceiverByChildrenId(UUID childrenId) {
        return Optional.ofNullable(
            jpaQueryFactory
                .select(Projections.constructor(
                    ParentReceiverDto.class,
                    parent.id,
                    children.id,
                    children.name
                ))
                .from(childrenParentRelation)
                .join(childrenParentRelation.parent, parent)
                .join(childrenParentRelation.children, children)
                .where(
                    children.id.eq(childrenId),
                    childrenParentRelation.relationStatus.eq(RelationStatus.ACTIVE)
                )
                .fetchFirst()
        );
    }
}
