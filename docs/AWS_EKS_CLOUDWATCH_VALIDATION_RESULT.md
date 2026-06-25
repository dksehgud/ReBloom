# AWS EKS CloudWatch Validation Result

## Summary

검증용 AWS 환경에서 ReBloom `report-service` 파드 수와 HikariCP 커넥션 풀 크기가 RDS PostgreSQL 연결 수에 미치는 영향을 확인했다.

이번 검증은 로컬 Docker 시뮬레이션만으로 끝내지 않고, 실제 EKS 파드에서 실제 RDS로 JDBC 연결을 생성한 뒤 CloudWatch `DatabaseConnections`, PostgreSQL `pg_stat_activity`, Kubernetes rollout/log를 함께 수집했다.

## Environment

| Item | Value |
| --- | --- |
| Region | `ap-northeast-2` |
| EKS cluster | `rebloom-proof` |
| Node group | `rebloom-proof-ng` |
| Namespace | `rebloom-proof` |
| RDS instance | `rebloom-proof-db` |
| RDS engine | PostgreSQL 16.14 |
| RDS class | `db.t4g.micro` |
| RDS `max_connections` | `40` |
| Test service | `report-service` |
| Image | `rebloom-proof-report-service:latest` |

## Evidence Files

### Portfolio images

- CloudWatch graph for actual `report-service` validation: `docs/portfolio-captures/aws-cloudwatch/02-report-service-cloudwatch-database-connections.png`
- Earlier connection-job CloudWatch graph: `docs/portfolio-captures/aws-cloudwatch/01-cloudwatch-database-connections.png`

### Raw evidence

- Before service pods: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-kubectl-output.txt`
- Before deployment describe: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-deployment-describe.txt`
- Before service logs: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-current.txt`
- Before DB monitor result: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-before-pg-stat-activity.txt`
- Blocked rolling update observation: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-rolling-update-blocked-describe.txt`
- After service pods: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-kubectl-output.txt`
- After service logs: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-current.txt`
- After DB monitor result: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-after-pg-stat-activity.txt`
- CloudWatch raw metric for service window: `docs/portfolio-captures/aws-cloudwatch/raw/report-service-cloudwatch-database-connections-service-window.json`

## Actual Service Validation

### Before

의도적으로 위험한 설정을 재현했다.

| Metric | Value |
| --- | ---: |
| Replicas | 3 |
| HikariCP max pool per pod | 20 |
| Theoretical max DB connections | 60 |
| RDS `max_connections` | 40 |

결과:

```text
Replicas: 3 desired | 3 updated | 4 total | 2 available | 2 unavailable
DB_POOL_MAX_SIZE: 20
DB_POOL_MIN_IDLE: 20
```

새 SSL 설정이 적용된 `report-service` 파드는 DB 연결 한계에서 실패했다.

```text
SQL State  : 53300
Message    : FATAL: remaining connection slots are reserved for roles with privileges of the "rds_reserved" role
```

동일 시점에 DB 모니터링 쿼리도 접속 슬롯 부족으로 실패했다.

```text
psql: error: connection to server ... failed:
FATAL: remaining connection slots are reserved for roles with privileges of the "rds_reserved" role
```

CloudWatch `DatabaseConnections` 기준 실제 서비스 before 구간은 `2026-06-25 16:51~16:58 KST`에 최대 `31`개 연결을 유지했다. 실패한 연결 시도는 DB 세션으로 열리지 않기 때문에 CloudWatch 값에는 성공적으로 열린 세션만 반영된다.

### Rolling Update Observation

풀 크기를 20에서 8로 낮춘 매니페스트를 바로 rolling update로 적용했을 때도 처음에는 rollout이 막혔다.

이유는 기존 before 파드 2개가 이미 DB 연결을 점유하고 있었고, 새 after 파드가 시작하면서 필요한 초기 DB 연결을 확보하지 못했기 때문이다.

이 관찰은 운영에서 풀 크기를 줄일 때 단순히 설정만 바꾸면 끝나는 것이 아니라, 기존 파드의 연결 해제와 rollout 전략도 같이 봐야 한다는 근거가 된다.

### After

기존 before 파드를 0개로 내려 DB 연결을 반환시킨 뒤, 동일 이미지에 풀 크기만 8로 제한한 after 설정을 적용했다.

| Metric | Value |
| --- | ---: |
| Replicas | 3 |
| HikariCP max pool per pod | 8 |
| Theoretical max DB connections | 24 |
| RDS `max_connections` | 40 |

결과:

```text
deployment "report-service-proof" successfully rolled out

report-service-proof-85ff779fff-4bjzz   1/1   Running   0
report-service-proof-85ff779fff-np6tq   1/1   Running   0
report-service-proof-85ff779fff-tv75h   1/1   Running   0
```

PostgreSQL `pg_stat_activity`:

```text
max_connections = 40

total_sessions   = 32
rebloom_sessions = 25
app_jdbc_sessions = 24
rebloom_active   = 1
rebloom_idle     = 24
```

여기서 `app_jdbc_sessions=24`가 실제 `report-service` 3개 파드가 유지한 JDBC 커넥션이다. `rebloom_active=1`은 모니터링용 `psql` 연결이다.

CloudWatch `DatabaseConnections` 기준 after 구간은 `2026-06-25 17:00~17:01 KST`에 `24`개 연결로 안정화됐다.

## Comparison

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Service replicas | 3 | 3 | Same |
| HikariCP max pool per pod | 20 | 8 | 60% lower |
| Theoretical max DB connections | 60 | 24 | 60% lower |
| RDS `max_connections` | 40 | 40 | Same |
| Ready service pods | 2 / 3 | 3 / 3 | +1 pod |
| CrashLoopBackOff pods | 1+ | 0 | Eliminated |
| DB monitor query | Failed | Succeeded | Recovered observability |
| Actual app JDBC sessions | Saturated, monitor could not connect | 24 | Within budget |
| CloudWatch max in service window | 31 | 24 | 22.6% lower |
| Connection-slot failure | Observed | Not observed | Eliminated |

## What Was Improved

실제 병목은 "사용자 30명이 동시에 접속하면 DB 연결이 30개 생긴다"가 아니라, EKS에서 여러 파드가 뜨면서 각 파드의 HikariCP 풀이 동시에 DB 연결을 확보하려는 구조였다.

예를 들어 파드 3개가 있고 각 파드의 최대 풀이 20이면, 사용자가 많지 않아도 애플리케이션은 최대 60개의 DB 연결을 열 수 있다. RDS가 애플리케이션에 안정적으로 제공할 수 있는 연결 수보다 이 값이 크면 신규 파드 시작, 배포, 트래픽 증가 시점에 DB 연결 슬롯 부족이 발생한다.

개선은 각 서비스의 HikariCP 풀 크기를 환경변수로 명시하고, EKS 배포 설정에서 파드당 기본 풀 크기를 8로 제한한 것이다. 이로써 파드 3개 기준 최대 DB 연결 예산을 60에서 24로 낮췄고, 실제 AWS 검증에서 `report-service` 3개 파드가 모두 Ready 상태로 올라오는 것을 확인했다.

## Portfolio Narrative

EKS 기반 MSA 환경에서는 단일 요청 성능뿐 아니라 파드 수와 DB 커넥션 풀의 곱이 운영 병목이 될 수 있다고 판단했습니다. 기존에는 서비스별 HikariCP 풀 크기가 운영 환경 기준으로 명확히 제한되지 않아, 파드 3개가 각각 20개의 풀을 가지면 최대 60개의 DB 연결을 시도할 수 있었습니다.

이를 검증하기 위해 `max_connections=40`으로 제한한 RDS PostgreSQL과 EKS 클러스터를 구성하고, 실제 `report-service` 파드 3개를 배포했습니다. before 조건에서는 3개 파드 중 일부만 Ready가 되고, 신규 파드는 `remaining connection slots are reserved` 오류로 실패했습니다. CloudWatch `DatabaseConnections`는 실제 열린 연결 기준 최대 31개를 기록했고, DB 모니터링 쿼리마저 접속 슬롯 부족으로 실패했습니다.

이후 파드당 HikariCP 최대 풀 크기를 8로 제한하고 동일한 3개 파드를 다시 배포했습니다. after 조건에서는 모든 파드가 Ready 상태가 되었고, PostgreSQL `pg_stat_activity`에서 실제 애플리케이션 JDBC 세션이 24개로 확인됐습니다. CloudWatch에서도 after 구간의 `DatabaseConnections`가 24개로 안정화되어, 파드 증가 시 누적되는 DB 연결 고갈 위험을 정량적으로 낮췄음을 확인했습니다.

## Cleanup Required

검증 후 아래 리소스는 비용 방지를 위해 삭제해야 한다.

- EKS cluster: `rebloom-proof`
- Managed node group: `rebloom-proof-ng`
- Kubernetes namespace/workloads: `rebloom-proof`
- RDS instance: `rebloom-proof-db`
- RDS subnet group: `rebloom-proof-db-subnets`
- RDS security group: `rebloom-proof-rds-sg`
- RDS parameter group: `rebloom-proof-postgres16-maxconn40`
- SSM parameters under `/rebloom-proof/db/*`
- ECR repository: `rebloom-proof-report-service`
