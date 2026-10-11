@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM 检查本机运行环境，所有依赖仅安装到当前项目。
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 24 LTS，再打开此文件。
  pause
  exit /b 1
)
if not exist dist\index.html (
  echo 正在安装地图依赖，首次运行需要联网……
  call npm.cmd ci --cache .cache\npm --no-audit --no-fund
  if errorlevel 1 (
    echo 安装未完成，请检查网络后重试。
    pause
    exit /b 1
  )
  call npm.cmd run build
  if errorlevel 1 (
    echo 构建未完成，请查看窗口中的错误信息。
    pause
    exit /b 1
  )
)
echo 极北铁幕地图正在启动。
call npm.cmd start
pause
