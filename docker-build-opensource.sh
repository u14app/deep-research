#!/bin/bash

###############################################################################
# Deep Research - 开源版构建脚本
#
# 功能：
# - 清理 Docker 构建缓存
# - 构建开源版本镜像
# - 支持完整功能和所有 AI 提供商
#
# 使用方法：
#   chmod +x docker-build-opensource.sh
#   ./docker-build-opensource.sh
###############################################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Deep Research - 开源版构建"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="deep-research"
IMAGE_TAG="opensource"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${YELLOW}[1/4] 清理 Docker 缓存...${NC}"
echo "----------------------------------------"

# 停止并删除旧容器（如果存在）
if docker ps -a | grep -q "${IMAGE_NAME}"; then
    echo "  停止旧容器..."
    docker stop ${IMAGE_NAME} 2>/dev/null || true
    docker rm ${IMAGE_NAME} 2>/dev/null || true
fi

# 删除旧镜像（如果存在）
if docker images | grep -q "${IMAGE_NAME}.*${IMAGE_TAG}"; then
    echo "  删除旧镜像 ${FULL_IMAGE}..."
    docker rmi ${FULL_IMAGE} 2>/dev/null || true
fi

# 清理构建缓存
echo "  清理 Docker 构建缓存..."
docker builder prune -f

echo -e "${GREEN}✓ 缓存清理完成${NC}"
echo ""

echo -e "${YELLOW}[2/4] 开始构建开源版镜像...${NC}"
echo "----------------------------------------"
echo "  镜像名称: ${FULL_IMAGE}"
echo "  构建模式: 开源版 (Open Source)"
echo "  功能特性:"
echo "    - ✓ 支持所有 AI 提供商"
echo "    - ✓ 用户可配置 API URL"
echo "    - ✓ 用户可选择模型"
echo "    - ✓ 支持 local/proxy 模式切换"
echo ""

# 构建开源版（使用默认参数，不设置 CLOSED_SOURCE_MODE）
docker build \
  --no-cache \
  --build-arg CLOSED_SOURCE_MODE=false \
  --tag ${FULL_IMAGE} \
  --tag ${IMAGE_NAME}:latest \
  .

echo -e "${GREEN}✓ 镜像构建完成${NC}"
echo ""

echo -e "${YELLOW}[3/4] 验证镜像...${NC}"
echo "----------------------------------------"
docker images | grep ${IMAGE_NAME}
echo ""

echo -e "${YELLOW}[4/4] 构建信息${NC}"
echo "----------------------------------------"
echo "  镜像名称: ${FULL_IMAGE}"
echo "  构建时间: $(date)"
echo "  镜像大小: $(docker images ${FULL_IMAGE} --format '{{.Size}}')"
echo ""

echo -e "${GREEN}=========================================="
echo "  ✓ 开源版构建成功！"
echo "==========================================${NC}"
echo ""
echo "下一步操作："
echo ""
echo "1. 运行容器:"
echo "   docker run -d -p 3333:3000 --name ${IMAGE_NAME} ${FULL_IMAGE}"
echo ""
echo "2. 使用 docker-compose:"
echo "   编辑 docker-compose.yml，设置 image: ${FULL_IMAGE}"
echo "   docker-compose up -d"
echo ""
echo "3. 访问应用:"
echo "   http://localhost:3333"
echo ""
echo "4. 查看日志:"
echo "   docker logs -f ${IMAGE_NAME}"
echo ""
