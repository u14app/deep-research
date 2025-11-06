#!/bin/bash

# Docker 构建脚本
# 使用 docker-compose 构建 Deep Research 应用

set -e

echo "🔨 开始构建 Deep Research Docker 镜像..."
echo "================================================"

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "提示: 复制 .env.example 到 .env 并配置您的 API 密钥"
    echo ""
    read -p "是否继续构建? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 构建已取消"
        exit 1
    fi
fi

# 构建镜像
echo "📦 正在构建 Docker 镜像..."
docker-compose build --no-cache

echo ""
echo "✅ 构建完成!"
echo "================================================"
echo "下一步:"
echo "  1. 确保 .env 文件已配置"
echo "  2. 运行: ./docker-run.sh 启动应用"
echo "  3. 或运行: docker-compose up -d"
echo "================================================"
