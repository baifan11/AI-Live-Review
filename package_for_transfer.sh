#!/bin/bash

# 设置错误时退出
set -e

echo "📦 开始打包 Docker 部署文件..."

# 1. 确保镜像最新
echo "🔨 构建最新镜像..."
docker-compose build

# 2. 创建部署目录
DEPLOY_DIR="ai-review-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 3. 导出镜像
echo "💾 导出 Docker 镜像 (这可能需要几分钟)..."
docker save -o $DEPLOY_DIR/images.tar ai-live-review-backend:latest ai-live-review-nginx:latest

# 4. 复制配置文件
echo "Cc 复制配置文件..."
cp docker-compose.yml $DEPLOY_DIR/
cp .env $DEPLOY_DIR/
# 复制 config 目录（如果有自定义配置）
if [ -d "config" ]; then
    cp -r config $DEPLOY_DIR/
fi
# 复制 i18n 目录 (前端构建可能需要，或者后端运行时需要)
if [ -d "i18n" ]; then
    cp -r i18n $DEPLOY_DIR/
fi

# 5. 创建导入脚本
cat > $DEPLOY_DIR/install.sh << 'EOF'
#!/bin/bash
echo "🚀 开始安装 AI-Live-Review..."

# 检查 docker 命令是否存在
if ! command -v docker &> /dev/null; then
    # 尝试查找常见路径
    if [ -f "/usr/local/bin/docker" ]; then
        export PATH="/usr/local/bin:$PATH"
    elif [ -f "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
    else
        echo "⚠️  警告: 未在系统 PATH 中找到 'docker' 命令。"
        echo "如果您确认已安装 Docker Desktop，请确保将其添加到 PATH 中。"
        read -p "是否尝试继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 检查 Docker 服务是否正在运行
echo "🔍 检查 Docker 服务状态..."
echo "   (如果此处长时间卡住，说明 Docker Desktop 尚未完全启动或无响应)"

# 使用 perl 实现 5秒超时检查 (兼容 Mac/Linux)
if ! perl -e 'alarm 5; exec @ARGV' docker info > /dev/null 2>&1; then
    echo ""
    echo "⚠️  无法快速连接到 Docker 服务 (超时或失败)。"
    echo "    可能原因："
    echo "    1. Docker Desktop 未启动"
    echo "    2. Docker 正在启动中 (图标在转圈)"
    echo "    3. 当前用户没有权限访问 Docker"
    echo ""
    read -p "    是否忽略此检查并强制继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 已取消安装。"
        exit 1
    fi
else
    echo "✅ Docker 服务正常"
fi

# 加载镜像
echo "📥 加载 Docker 镜像..."
docker load -i images.tar

# 创建必要的目录
echo "📂 创建数据目录..."
mkdir -p storage logs downloads backup_config

# 启动服务
echo "▶️ 启动服务..."
docker-compose up -d

echo "✅ 部署完成！"
echo "访问 http://localhost:8080 使用系统"
EOF

chmod +x $DEPLOY_DIR/install.sh

# 6. 创建 Windows 安装脚本 (install.bat)
cat > $DEPLOY_DIR/install.bat << 'EOF'
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
EOF

# 7. 生成说明文件
cat > $DEPLOY_DIR/README.txt << EOF
AI-Live-Review 离线部署包
==========================

使用说明：

[Mac / Linux]
1. 打开终端
2. 运行: sh install.sh

[Windows]
1. 确保 Docker Desktop 已启动
2. 双击运行 install.bat

注意：
- 目标电脑必须已安装 Docker。
- 如果需要修改配置（如 API Key），请编辑 .env 文件。
EOF

echo "✅ 打包完成！"
echo "请将 $DEPLOY_DIR 文件夹复制到目标电脑即可。"
