@echo off
title Mergence - keep this window open
cd /d "%~dp0"

echo ============================================================
echo   Starting Mergence...
echo.
echo   KEEP THIS WINDOW OPEN while you use the website.
echo   When you see "Ready", open this link in your browser:
echo.
echo        http://localhost:3000
echo.
echo   To STOP the website: close this window (or press Ctrl+C).
echo ============================================================
echo.

call npm run dev

echo.
echo The server has stopped. You can close this window.
pause
