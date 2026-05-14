@echo off
call "%~dp0_root.bat"
docker compose -f "Infra\middleware\docker-compose.middleware.yaml" up -d
call "%ROOT_DIR%\BE\gradlew.bat" -p "%ROOT_DIR%\BE" :services:auth-service:bootJar :services:intake-service:bootJar :services:biometric-service:bootJar :services:report-service:bootJar :services:notification-service:bootJar :services:gateway-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra up -d postgres redis
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build auth-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build intake-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build biometric-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build report-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build notification-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build gateway-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app ps
echo Done.
exit /b 0
