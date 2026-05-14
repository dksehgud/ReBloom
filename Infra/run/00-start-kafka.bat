@echo off
call "%~dp0_root.bat"
docker compose -f "Infra\middleware\docker-compose.middleware.yaml" up -d
echo Done.
exit /b 0
