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
