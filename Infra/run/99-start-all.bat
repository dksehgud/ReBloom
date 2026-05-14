@echo off
call "%~dp0_root.bat"
docker compose -f "Infra\middleware\docker-compose.middleware.yaml" up -d
call "BE\gradlew.bat" :services:auth-service:bootJar :services:intake-service:bootJar :services:biometric-service:bootJar :services:report-service:bootJar :services:notification-service:bootJar :services:gateway-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build postgres redis auth-service intake-service biometric-service report-service notification-service gateway-service
pause
