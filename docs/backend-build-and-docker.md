# Backend Build & Docker 실행 명령어

## 위치 이동

백엔드 명령어는 `BE` 디렉터리에서 실행합니다.

```bash
cd BE
```

## Gradle 빌드

Docker 실행 전 전체 백엔드 빌드:

```bash
./gradlew build -x test
```

Windows PowerShell에서 Docker 실행 전 전체 백엔드 빌드:

```bash
./gradlew.bat build -x test
```

테스트까지 포함한 전체 빌드:

```bash
./gradlew build
```

특정 서비스만 빌드:

```bash
./gradlew :services:gateway-service:bootJar
```

```bash
./gradlew :services:auth-service:bootJar
```

## Docker Compose 실행

기존 이미지로 전체 실행:

```bash
docker compose --profile infra --profile app up -d
```

빌드까지 다시 하고 전체 실행:

```bash
docker compose --profile infra --profile app up -d --build
```

인프라만 실행:

```bash
docker compose --profile infra up -d
```

앱 서비스만 실행:

```bash
docker compose --profile app up -d
```

## 특정 서비스만 다시 빌드해서 실행

게이트웨이 서비스만 다시 빌드해서 실행:

```bash
./gradlew :services:gateway-service:bootJar
docker compose --profile infra --profile app up -d --build gateway-service
```

인증 서비스만 다시 빌드해서 실행:

```bash
./gradlew :services:auth-service:bootJar
docker compose --profile infra --profile app up -d --build auth-service
```

Windows PowerShell에서 특정 서비스만 다시 빌드해서 실행:

```bash
./gradlew.bat :services:gateway-service:bootJar
docker compose --profile infra --profile app up -d --build gateway-service
```

## 상태 확인

컨테이너 상태 확인:

```bash
docker compose ps
```

전체 로그 확인:

```bash
docker compose logs -f
```

특정 서비스 로그 확인:

```bash
docker compose logs -f gateway-service
```

```bash
docker compose logs -f auth-service
```

## 종료

컨테이너 종료:

```bash
docker compose down
```

컨테이너와 볼륨까지 삭제:

```bash
docker compose down -v
```

## 참고

`docker compose up -d`는 기존 이미지가 있으면 재사용합니다. 코드나 설정 파일 변경사항을 컨테이너에 반영하려면 `--build` 옵션을 함께 사용합니다.
