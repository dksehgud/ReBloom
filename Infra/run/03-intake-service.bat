@echo off
call "%~dp0_root.bat"
docker compose -f "Infra\middleware\docker-compose.middleware.yaml" up -d
call "BE\gradlew.bat" :services:intake-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build intake-service
pause
