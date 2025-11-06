#!/bin/bash

# Docker 运行脚本
# 使用 docker-compose 启动 Deep Research 应用

set -e

echo "🚀 启动 Deep Research 应用..."
echo "================================================"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先创建 .env 文件并配置您的 API 密钥"
    exit 1
fi

# 检查镜像是否存在
if ! docker images | grep -q "deep-research"; then
    echo "⚠️  镜像不存在，开始构建..."
    ./docker-build.sh
fi

# 启动容器
echo "📦 正在启动容器..."
docker-compose up -d

echo ""
echo "✅ 应用已启动!"
echo "================================================"
echo "访问地址: http://localhost:3333"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  查看状态: docker-compose ps"
echo "  停止应用: docker-compose stop"
echo "  停止并删除: docker-compose down"
echo "================================================"
