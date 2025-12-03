#!/bin/bash

# AI-Live-Review Docker 快速启动脚本
# 使用方法: ./docker-start.sh

set -e

echo "🐳 AI-Live-Review Docker 启动脚本"
echo "=================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "正在创建 .env 文件..."
    cat > .env << EOF
# 阿里云 DashScope API Key（必需）
DASHSCOPE_API_KEY=your_api_key_here

# 时区设置
TZ=Asia/Shanghai

# Python 配置
PYTHONUNBUFFERED=1
EOF
    echo "✅ .env 文件已创建，请编辑并填入您的 API Key"
    echo "   编辑命令: nano .env 或 vim .env"
    exit 1
fi

# 检查 API Key 是否配置
if grep -q "your_api_key_here" .env; then
    echo "⚠️  警告: 请先在 .env 文件中配置 DASHSCOPE_API_KEY"
    echo "   编辑命令: nano .env 或 vim .env"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p storage logs downloads backup_config config
echo "✅ 目录创建完成"
echo ""

# 询问是否重新构建
read -p "是否重新构建镜像? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BUILD_FLAG="--build"
    echo "🔨 将重新构建 Docker 镜像..."
else
    BUILD_FLAG=""
    echo "📦 使用现有镜像..."
fi

echo ""
echo "🚀 启动 Docker 服务..."
echo ""

# 使用 docker compose 或 docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# 启动服务
$COMPOSE_CMD up -d $BUILD_FLAG

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态:"
$COMPOSE_CMD ps

echo ""
echo "✅ 启动完成!"
echo ""
echo "🌐 访问地址:"
echo "   - 前端界面: http://localhost"
echo "   - 后端 API: http://localhost:8000"
echo "   - API 文档: http://localhost/tasks/"
echo ""
echo "📝 常用命令:"
echo "   - 查看日志: $COMPOSE_CMD logs -f"
echo "   - 停止服务: $COMPOSE_CMD down"
echo "   - 重启服务: $COMPOSE_CMD restart"
echo ""
echo "💡 提示: 首次启动可能需要几分钟时间，请耐心等待"
echo ""

# 询问是否查看日志
read -p "是否查看实时日志? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 显示实时日志 (按 Ctrl+C 退出)..."
    echo ""
    $COMPOSE_CMD logs -f
fi
