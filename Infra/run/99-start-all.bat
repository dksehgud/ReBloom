@echo off
call "%~dp0_root.bat"
docker compose -f "Infra\middleware\docker-compose.middleware.yaml" up -d
call "%ROOT_DIR%\BE\gradlew.bat" -p "%ROOT_DIR%\BE" :services:auth-service:bootJar :services:intake-service:bootJar :services:biometric-service:bootJar :services:report-service:bootJar :services:notification-service:bootJar :services:gateway-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build postgres redis auth-service intake-service biometric-service report-service notification-service gateway-service
docker compose -f "BE\docker-compose.yml" --profile infra --profile app ps
echo Done.
exit /b 0
