@echo off
for %%I in ("%~dp0..\..") do set "ROOT_DIR=%%~fI"
cd /d "%ROOT_DIR%"
docker network inspect rebloom-network >nul 2>nul || docker network create rebloom-network

