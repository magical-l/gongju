@echo off
chcp 65001 >nul
echo ========================================
echo 围棋游戏测试服务器启动脚本
echo ========================================
echo.
echo 正在启动本地HTTP服务器...
echo.

cd /d "%~dp0\..\.."

REM 等待1秒后自动打开浏览器
start "" "http://localhost:8000/游戏/围棋/go-test.html"
timeout /t 1 /nobreak >nul

echo 浏览器已自动打开测试页面
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

python -m http.server 8000

pause
