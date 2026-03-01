@echo off
REM Database Setup Script for MariaDB (Windows)

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo MariaDB Database Setup Script (Windows)
echo ==========================================
echo.

REM Configuration
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=root
set DB_NAME=app_db

echo [Step 1] Checking MariaDB Connection
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Test connection
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% -e "SELECT 1;" > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [✓] Connected to MariaDB successfully
) else (
    echo [✗] Failed to connect to MariaDB
    echo.
    echo Please ensure:
    echo   1. MariaDB service is running
    echo   2. Username and password are correct
    echo   3. MariaDB is listening on %DB_HOST%:%DB_PORT%
    echo.
    pause
    exit /b 1
)

echo.
echo [Step 2] Creating Database
echo.

REM Create database
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% <<EOFMYSQL
CREATE DATABASE IF NOT EXISTS %DB_NAME% DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EOFMYSQL

if %ERRORLEVEL% EQU 0 (
    echo [✓] Database created successfully
) else (
    echo [✗] Failed to create database
    pause
    exit /b 1
)

echo.
echo [Step 3] Generating Prisma Client
echo.

call npx prisma generate

if %ERRORLEVEL% EQU 0 (
    echo [✓] Prisma client generated
) else (
    echo [✗] Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [Step 4] Running Database Migrations
echo.

call npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo [✓] Migrations completed
) else (
    echo [✗] Failed to run migrations
    pause
    exit /b 1
)

echo.
echo [Step 5] Database Setup Summary
echo.

echo ==========================================
echo [✓] Database setup completed!
echo ==========================================
echo.
echo Next steps:
echo   1. Start the server: npm run dev
echo   2. View data: npx prisma studio
echo   3. Run tests: npm test
echo.
pause
