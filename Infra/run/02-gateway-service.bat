@echo off
call "%~dp0_root.bat"
call "BE\gradlew.bat" :services:gateway-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build gateway-service
pause
