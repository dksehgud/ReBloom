@echo off
call "%~dp0_root.bat"
call "%ROOT_DIR%\BE\gradlew.bat" -p "%ROOT_DIR%\BE" :services:gateway-service:bootJar
docker compose -f "BE\docker-compose.yml" --profile infra --profile app up -d --build gateway-service
echo Done.
exit /b 0
