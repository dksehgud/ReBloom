@echo off
call "%~dp0_root.bat"
call "BE\gradlew.bat" :services:report-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build report-service
pause
