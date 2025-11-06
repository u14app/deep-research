#!/bin/bash

# Docker 停止脚本
# 停止 Deep Research 应用

set -e

echo "🛑 停止 Deep Research 应用..."
echo "================================================"

# 显示当前运行的容器
echo "当前运行的容器:"
docker-compose ps

echo ""
read -p "确认停止应用? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose stop
    echo ""
    echo "✅ 应用已停止"
    echo ""
    read -p "是否删除容器? (保留数据卷) (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down
        echo "✅ 容器已删除 (数据卷已保留)"
    fi
else
    echo "❌ 已取消"
fi

echo "================================================"
