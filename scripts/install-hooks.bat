@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Git Hooks 安装脚本
echo   MDEditor WebSite
echo ========================================
echo.

node "%~dp0install-hooks.js"

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo 安装失败，请检查错误信息
  pause
  exit /b %ERRORLEVEL%
)

echo.
pause
