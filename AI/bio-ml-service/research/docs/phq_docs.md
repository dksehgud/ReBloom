# PHQ-9 이진 분류 모델 개발 문서

## 1. 프로젝트 개요

### 목적
웨어러블 기기로 수집한 생체 데이터(HRV, 수면, 활동량)와 설문 데이터를 활용하여
PHQ-9(우울증 선별 도구) 점수를 이진 분류하는 모델을 개발한다.

### 라벨 정의
- **0 (정상)**: PHQ-9 점수 ≤ 4
- **1 (우울 위험)**: PHQ-9 점수 > 4

### 데이터 구성
| 파일 | 설명 | 크기 |
|---|---|---|
| sensor_hrv.csv | 5분 단위 생체 데이터 | 79,639행 × 30열 |
| sleep_diary.csv | 일별 수면 데이터 | 1,372행 × 11열 |
| survey.csv | 설문 데이터 (인구통계, PHQ-9 등) | 49행 × 23열 |

---

## 2. 데이터 탐색 (EDA)

### 2.1 피험자 및 라벨 현황

- 총 피험자: **49명**
- 설문 횟수: 1인당 2회 (약 2주 간격)
- 총 라벨 수: **98개**
- 클래스 분포: 0(정상) 63개 / 1(우울) 35개 → **약 64:36** (심각한 불균형 아님)

### 2.2 생체 데이터 탐색

**ts_start 형식 확인**
- 데이터 타입: int64
- 형식: 밀리초(ms) 단위 Unix timestamp
- 변환 방법: `pd.to_datetime(ts_start, unit="ms")`

**피험자별 데이터 기간**
- 수집 기간: 2021-03-04 ~ 2021-04-08 (약 28~36일)
- 총일수 14~28일: 16명
- 총일수 28일 초과: 33명
- 총일수 14일 미만: 0명 (전원 최소 14일 이상 데이터 보유)

**데이터 기간 분할 방식 결정**
초기에는 고정 14일(day_rank 1~14, 15~28) 기준으로 period를 나눴으나,
피험자마다 수집 기간이 달라 period=2 데이터가 없는 경우가 발생하였다.
이를 해결하기 위해 **각 피험자의 실제 데이터 기간을 절반으로 나누는 방식**으로 변경하였다.

```python
dates    = sorted(sub["date"].unique())
mid_date = dates[len(dates) // 2]

period 1 → date < mid_date
period 2 → date >= mid_date
```

결과: p1 평균 14.1일 / p2 평균 14.7일로 균형 있게 분할됨

### 2.3 HRV 변수 정리

sensor_hrv에는 IBI(박동 간격)에서 파생된 다양한 HRV 지표가 포함되어 있다.
중복 정보를 제거하고 대표 변수만 선택하였다.

**제거된 변수 및 이유**
| 변수 | 제거 이유 |
|---|---|
| sdnn | rmssd와 높은 상관관계, rmssd로 대표 가능 |
| sdsd | rmssd와 유사한 정보 |
| pnn20 | pnn50에 포함되는 개념 |
| lf, hf (개별) | 비율(lf/hf)이 더 의미있음 |
| ibi | 원본값, 파생변수로 충분히 표현됨 (단, ibi 자체는 집계에 포함) |
| calories | 분석에서 제외 결정 |
| light_avg | 분석에서 제외 결정 |

**최종 사용 HRV 변수**
- HR, ibi, rmssd, pnn50, lf/hf

### 2.4 수면 변수 정리

**사용 변수**
| 변수 | 의미 |
|---|---|
| sleep_duration | 총 수면 시간 |
| sleep_latency | 입면 소요 시간 (잠들기까지 걸린 시간) |
| waso | 수면 중 각성 시간 |
| sleep_efficiency | 수면 효율 |
| wakeup@night | 야간 각성 횟수 |
| asleep | 실제 잠든 시각 (불규칙성 계산용) |
| wakeup | 기상 시각 (불규칙성 계산용) |

**제외 변수**
- go_to_bed, in_bed_duration: 수집 불가 → 제외

### 2.5 설문 변수 정리

최종적으로 **sex, age** 2개만 사용하기로 결정하였다.
(나머지 생활습관, 결혼 여부 등은 제외)

---

## 3. Feature Engineering

### 3.1 집계 방식 결정: Median vs Mean 비교

웨어러블 데이터 특성상 움직임 아티팩트, 센서 오류 등으로 이상치가 많이 발생한다.
두 집계 방식을 LOSO-CV로 비교한 결과 아래와 같다.

| 집계 방식 | AUC-ROC | Accuracy | Recall | F1 |
|---|---|---|---|---|
| Median | **0.678** | **0.684** | **0.600** | **0.575** |
| Mean | 0.645 | 0.633 | 0.600 | 0.538 |

**→ Median 방식 채택**: 이상치에 강건하여 "전형적인 상태"를 더 잘 표현함

### 3.2 생성된 Feature 목록

**생체 데이터 Feature (sensor_hrv)**

| 구분 | 변수 | 집계 |
|---|---|---|
| 전체 집계 | HR, ibi, rmssd, pnn50, lf/hf | median, std |
| 주간(9~21시) | HR, ibi, rmssd, pnn50, lf/hf | day_median, day_std |
| 야간(22~8시) | HR, ibi, rmssd, pnn50, lf/hf | night_median, night_std |
| ACC 전체 | acc_mag (x,y,z → magnitude 합성) | median, std |
| ACC 야간 | acc_mag | night_std (수면 중 뒤척임) |
| 추세 | HR, ibi, rmssd, pnn50, lf/hf | trend (후반 - 전반 median 차이) |

> ACC magnitude 계산: `sqrt(acc_x² + acc_y² + acc_z²)`
> 개별 축 값 대신 magnitude를 사용한 이유: 기기 착용 방향에 무관하게 순수 활동 강도를 반영하기 위함

**수면 데이터 Feature (sleep_diary)**

| 구분 | 변수 | 집계 |
|---|---|---|
| 전체 집계 | sleep_duration, sleep_latency, waso, sleep_efficiency, wakeup@night | median, std |
| 불규칙성 | asleep, wakeup (시각 → 분 변환) | std |
| 추세 | 위 5개 | trend (후반 - 전반 차이) |

> 취침/기상 시각 변환: HH:MM → 분, 새벽 시간(600분 미만)은 +1440 보정

**설문 Feature**
- sex, age

### 3.3 최종 Feature 수

결측률 40% 초과 feature 자동 제거 후 총 **58개** feature 사용

---

## 4. 모델링

### 4.1 검증 방법: LOSO-CV

**LOSO-CV (Leave-One-Subject-Out Cross Validation)**를 채택하였다.

- 피험자 1명(2회 측정 데이터 모두)을 test set으로 제외
- 나머지 48명(96행)으로 train
- 49번 반복 → 98행 전부 1회씩 예측
- **채택 이유**: 같은 피험자의 데이터가 train/test에 동시에 포함되면 개인 특성이 누출되어 성능이 과대평가됨. LOSO-CV는 완전히 새로운 사람에 대한 실제 일반화 성능을 측정함

### 4.2 Random Forest (전체 Feature)

| threshold | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| 0.50 | 0.673 | 0.600 | 0.257 | 0.360 |
| 0.45 | 0.673 | 0.556 | 0.429 | 0.484 |
| **0.40** | **0.684** | **0.553** | **0.600** | **0.575** |
| 0.35 | 0.612 | 0.469 | 0.657 | 0.548 |
| 0.30 | 0.561 | 0.435 | 0.771 | 0.557 |

- **AUC-ROC: 0.678**
- 최적 threshold: 0.40

### 4.3 Feature Importance 분석

Random Forest로 전체 feature 중요도를 산출하여 핵심 패턴을 파악하였다.

**상위 10개 Feature**
| 순위 | Feature | Importance | 의미 |
|---|---|---|---|
| 1 | sleep_duration_std | 0.082 | 수면 시간 변동성 |
| 2 | asleep_std | 0.047 | 취침 시간 불규칙성 |
| 3 | age | 0.043 | 나이 |
| 4 | HR_std | 0.035 | 심박 변동성 |
| 5 | rmssd_night_std | 0.033 | 야간 HRV 불안정성 |
| 6 | waso_std | 0.032 | 각성 시간 변동성 |
| 7 | rmssd_std | 0.031 | HRV 변동성 |
| 8 | lf/hf_median | 0.031 | 자율신경 균형 |
| 9 | acc_mag_median | 0.022 | 평균 활동량 |
| 10 | pnn50_night_std | 0.022 | 야간 부교감 불안정성 |

**핵심 발견: std(변동성) 계열이 median(중앙값) 계열보다 훨씬 중요**
→ 우울증은 "낮은 값"보다 "불규칙한 패턴"으로 더 잘 나타남

### 4.4 Logistic Regression (Feature 선택 후)

Feature Importance 상위 10개, 20개로 Logistic Regression을 적용하여 비교하였다.

| 모델 | AUC | Accuracy | Recall | F1 |
|---|---|---|---|---|
| Random Forest (전체) | 0.678 | 0.684 | 0.600 | 0.575 |
| **LR 상위 10개** | **0.787** | **0.724** | **0.771** | **0.667** |
| LR 상위 20개 | 0.713 | 0.673 | 0.629 | 0.579 |

*(threshold=0.50 기준)*

**→ Logistic Regression + 상위 10개 Feature 채택**

### 4.5 최종 모델 결과 (threshold=0.50)

```
모델: Logistic Regression (class_weight="balanced")
Feature: 상위 10개 (sleep_duration_std, asleep_std, age, HR_std,
          rmssd_night_std, waso_std, rmssd_std, lf/hf_median,
          acc_mag_median, pnn50_night_std)
검증: LOSO-CV (49-fold)

AUC-ROC  : 0.787
Accuracy : 0.724
Precision: 0.587
Recall   : 0.771
F1-score : 0.667

Confusion Matrix:
              예측 0   예측 1
  실제 0  :    44       19
  실제 1  :     8       27
```

우울한 피험자 35명 중 **27명(77.1%)** 을 정확히 탐지

---

## 5. 결론 및 시사점

### 5.1 모델 선택 근거

소규모 데이터(n=98)에서 복잡한 모델(Random Forest 전체 feature)보다
단순한 모델(Logistic Regression + 핵심 10개 feature)이 우수한 성능을 보였다.
이는 과적합 방지 측면에서 feature 수를 줄이는 것이 효과적임을 보여준다.

### 5.2 핵심 예측 변수

수면 및 HRV의 **변동성(std)** 지표가 평균값보다 우울증 예측에 더 중요하게 작용하였다.
이는 우울증이 수면 시간 자체의 감소보다 수면 패턴의 불규칙성과 더 관련있음을 시사한다.

### 5.3 임상적 의의

- Recall 0.771: 우울 위험군의 77%를 스크리닝 가능
- 2주치 웨어러블 데이터만으로 PHQ-9 고위험군 선별 가능
- 실시간 개입이 아닌 주기적 스크리닝 도구로 활용 가능

### 5.4 한계점

- 피험자 수 49명으로 일반화 가능성 제한적
- 설문 날짜 정보 부재로 기간 분할이 데이터 시작일 기준으로만 가능
- 단일 연구 기간(2021년 3~4월) 데이터로 계절적 편향 가능성