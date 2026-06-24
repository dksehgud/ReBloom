# 01. Before Record

## Problem

EKS에서 파드가 증가하면 각 파드의 HikariCP 커넥션풀이 누적된다. 기존 설정은 풀 상한을 서비스 설정에서 명시하지 않아, 파드 수와 rolling update 상황을 기준으로 전체 DB 연결 수를 계산하기 어려웠다.

## Risk Scenario

| Item | Value |
| --- | ---: |
| PostgreSQL `max_connections` | 40 |
| Estimated normal application slots | 37 |
| Pods | 3 |
| Pool size per pod | 20 |
| Attempted DB connections | 60 |

## Expected Bottleneck

애플리케이션이 최대 60개 연결을 만들 수 있지만 DB가 일반 애플리케이션 사용자에게 제공 가능한 슬롯은 37개뿐이므로 일부 요청은 커넥션 획득 단계에서 실패할 수 있다.
