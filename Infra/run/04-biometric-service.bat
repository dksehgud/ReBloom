@echo off
call "%~dp0_root.bat"
docker compose -f "Infra\middleware\docker-compose.middleware.yaml" up -d
call "%ROOT_DIR%\BE\gradlew.bat" -p "%ROOT_DIR%\BE" :services:biometric-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build biometric-service
echo Done.
exit /b 0

