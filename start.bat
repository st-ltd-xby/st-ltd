@echo off
chcp 65001 >nul
echo.
echo  ==========================================
echo    LTD 营销枢纽系统 - 一键启动
echo  ==========================================
echo.

echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js 已安装

echo.
echo [2/3] 启动后端服务...
start "LTD-Backend" cmd /k "cd /d %~dp0packages\server && npx ts-node src/app.ts"
timeout /t 5 /nobreak >nul

echo.
echo [3/3] 启动前端服务...
start "LTD-Frontend" cmd /k "cd /d %~dp0packages\web && npx vite"
timeout /t 3 /nobreak >nul

echo.
echo  ==========================================
echo    启动完成！
echo  ==========================================
echo.
echo  后端 API:    http://localhost:3000
echo  API 文档:    http://localhost:3000/api-docs
echo  前端页面:    http://localhost:5173
echo.
echo  测试账号:
echo    管理员: admin@ltd.com / admin123
echo    员工:   zhangsan@ltd.com / employee123
echo.
echo  按任意键退出此窗口（服务将继续运行）...
pause >nul
