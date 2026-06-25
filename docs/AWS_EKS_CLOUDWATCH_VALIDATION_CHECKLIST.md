# AWS EKS CloudWatch Validation Checklist

## Goal

AWS에 검증용 ReBloom 환경을 만들고, EKS 파드 수와 DB 커넥션 풀 크기가 RDS PostgreSQL 연결 수에 미치는 영향을 CloudWatch와 PostgreSQL 원본 지표로 확인한다.

이번 검증의 핵심 질문은 다음과 같다.

- EKS에서 파드가 늘어나면 파드별 HikariCP 풀이 누적되어 DB 연결 슬롯을 고갈시키는가?
- 풀 크기를 제한하면 같은 파드 수에서도 DB 연결 실패를 줄일 수 있는가?
- 이 개선을 CloudWatch, `pg_stat_activity`, Kubernetes 로그로 증명할 수 있는가?

## Completed Setup

- [x] AWS caller 확인
- [x] 기존 EKS 없음 확인
- [x] 검증용 EKS 클러스터 생성: `rebloom-proof`
- [x] 검증용 managed node group 생성: `rebloom-proof-ng`
- [x] 검증용 RDS PostgreSQL 생성: `rebloom-proof-db`
- [x] RDS `max_connections=40` 파라미터 그룹 적용
- [x] EKS 노드에서 RDS 접근 가능하도록 보안 그룹 구성
- [x] DB 접속 정보는 SSM/쿠버네티스 Secret으로만 주입
- [x] `report-service` Docker image build/push
- [x] EKS namespace `rebloom-proof` 구성

## Validation Plan And Status

### 1. Baseline

- [x] EKS node Ready 확인
- [x] RDS Available 확인
- [x] `SHOW max_connections`로 RDS 연결 한도 확인
- [x] CloudWatch `DatabaseConnections` 수집 경로 확인

### 2. Connection Job Scenario

목적: 실제 서비스 배포 전, 순수 PostgreSQL 세션만으로 연결 슬롯 고갈을 먼저 재현한다.

- [x] Before: 3 pods x 20 connections = 60 attempted connections
- [x] After: 3 pods x 8 connections = 24 attempted connections
- [x] Before 실패율 기록
- [x] After 실패율 기록
- [x] CloudWatch 그래프 생성

결과:

| Metric | Before | After |
| --- | ---: | ---: |
| Attempted connections | 60 | 24 |
| Successful connections | 31 | 24 |
| Failed connections | 29 | 0 |
| Failure rate | 48.3% | 0% |
| CloudWatch max | 31 | 24 |

### 3. Actual `report-service` Scenario

목적: 커스텀 스크립트가 아니라 실제 Spring Boot `report-service` 파드와 HikariCP 설정으로 병목을 재현한다.

- [x] Before deployment: replicas 3, pool 20
- [x] Before rollout 상태 수집
- [x] Before 실패 로그 수집
- [x] Before DB 모니터링 실패 기록
- [x] CloudWatch before service window 기록
- [x] After deployment: replicas 3, pool 8
- [x] After rollout 성공 확인
- [x] After `pg_stat_activity` 기록
- [x] CloudWatch after service window 기록

결과:

| Metric | Before | After |
| --- | ---: | ---: |
| Service replicas | 3 | 3 |
| Pool size per pod | 20 | 8 |
| Theoretical max connections | 60 | 24 |
| Ready pods | 2 / 3 | 3 / 3 |
| CrashLoopBackOff | Observed | 0 |
| DB monitor query | Failed | Succeeded |
| Actual app JDBC sessions | Saturated | 24 |
| CloudWatch max in service window | 31 | 24 |

### 4. Evidence Capture

- [x] CloudWatch graph: `docs/portfolio-captures/aws-cloudwatch/02-report-service-cloudwatch-database-connections.png`
- [x] CloudWatch raw metric: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-cloudwatch-database-connections-service-window.json`
- [x] Before pod status: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-kubectl-output.txt`
- [x] Before deployment describe: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-deployment-describe.txt`
- [x] Before failure logs: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-current.txt`
- [x] Before DB monitor failure: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-pg-stat-activity.txt`
- [x] After pod status: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-kubectl-output.txt`
- [x] After logs: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-current.txt`
- [x] After `pg_stat_activity`: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-pg-stat-activity.txt`
- [x] Result document: `docs/AWS_EKS_CLOUDWATCH_VALIDATION_RESULT.md`

## Remaining Checklist

- [x] 사용자가 CloudWatch/콘솔 화면을 직접 확인할 수 있게 리소스를 잠시 유지
- [x] 확인 후 비용 방지를 위해 AWS 검증 리소스 삭제
- [x] 삭제 후 `rebloom-proof` 관련 EKS/RDS/EC2/ECR 리소스가 남지 않았는지 확인
- [x] 최종 문서/캡처 커밋 및 GitHub push

## Cleanup Checklist

검증 캡처가 끝난 뒤 아래 리소스를 삭제했고, `2026-06-25`에 AWS 조회로 잔여 리소스가 없음을 확인했다.

- [x] `report-service-proof` deployment 삭제
- [x] `db-connection-before`, `db-connection-after` job 삭제
- [x] `rebloom-proof` namespace 삭제
- [x] EKS cluster `rebloom-proof` 삭제
- [x] RDS instance `rebloom-proof-db` 삭제
- [x] RDS subnet group `rebloom-proof-db-subnets` 삭제
- [x] RDS security group `rebloom-proof-rds-sg` 삭제
- [x] RDS parameter group `rebloom-proof-postgres16-maxconn40` 삭제
- [x] SSM parameters `/rebloom-proof/db/*` 삭제
- [x] ECR repository `rebloom-proof-report-service` 삭제
- [x] CloudFormation stacks 삭제 완료 확인
