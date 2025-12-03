@echo off
chcp 65001
echo 🚀 开始安装 AI-Live-Review...

REM 检查 docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: Docker 未运行，请先启动 Docker Desktop。
    pause
    exit /b
)

echo 📥 加载 Docker 镜像...
docker load -i images.tar

echo 📂 创建数据目录...
if not exist storage mkdir storage
if not exist logs mkdir logs
if not exist downloads mkdir downloads
if not exist backup_config mkdir backup_config

echo ▶️ 启动服务...
docker-compose up -d

echo ✅ 部署完成！
echo 访问 http://localhost:8080 使用系统
pause
