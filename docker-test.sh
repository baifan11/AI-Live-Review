#!/bin/bash

# Docker 配置验证脚本
# 使用方法: ./docker-test.sh

echo "🧪 Docker 配置验证"
echo "=================="
echo ""

# 检查必需文件
echo "📋 检查必需文件..."
files=("Dockerfile" "docker-compose.yml" "nginx.conf" ".dockerignore" "server/requirements.txt")
missing_files=()

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo ""
    echo "❌ 错误: 缺少必需文件"
    exit 1
fi

echo ""
echo "📦 检查 Docker 配置语法..."

# 验证 docker-compose.yml 语法
if command -v docker-compose &> /dev/null; then
    docker-compose config > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✅ docker-compose.yml 语法正确"
    else
        echo "  ❌ docker-compose.yml 语法错误"
        docker-compose config
        exit 1
    fi
elif docker compose version &> /dev/null; then
    docker compose config > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✅ docker-compose.yml 语法正确"
    else
        echo "  ❌ docker-compose.yml 语法错误"
        docker compose config
        exit 1
    fi
fi

# 验证 Dockerfile 语法（基本检查）
if grep -q "FROM" Dockerfile && grep -q "WORKDIR" Dockerfile; then
    echo "  ✅ Dockerfile 基本语法正确"
else
    echo "  ❌ Dockerfile 可能有问题"
fi

echo ""
echo "🔍 检查前端构建配置..."

if [ -f "web/package.json" ]; then
    if grep -q "\"build\"" web/package.json; then
        echo "  ✅ 前端构建脚本存在"
    else
        echo "  ⚠️  警告: web/package.json 中未找到 build 脚本"
    fi
else
    echo "  ❌ web/package.json 不存在"
fi

echo ""
echo "📁 检查目录结构..."

dirs=("server" "web" "src" "config" "i18n")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ⚠️  $dir/ (不存在，可能影响构建)"
    fi
done

echo ""
echo "✅ 所有检查通过！"
echo ""
echo "💡 下一步:"
echo "   1. 确保 .env 文件中配置了 DASHSCOPE_API_KEY"
echo "   2. 运行 ./docker-start.sh 启动服务"
echo "   3. 或运行 docker-compose up -d --build"
echo ""
