#!/bin/bash

###############################################################################
# Deep Research - 分发版构建脚本
#
# 功能：
# - 清理 Docker 构建缓存
# - 构建分发版本镜像（API 地址预配置）
# - 精简 UI，只保留 API 密钥输入
#
# 安全提示：
# - API 地址在构建时写入镜像，不出现在源码中
# - 请妥善保管此脚本，不要提交到公开仓库
#
# 使用方法：
#   chmod +x docker-build-closed.sh
#   ./docker-build-closed.sh
###############################################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Deep Research - 分发版构建"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 配置区域 - 交互式输入
# ============================================

IMAGE_NAME="deep-research"
IMAGE_TAG="closed"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${BLUE}=========================================="
echo "  分发版配置"
echo "==========================================${NC}"
echo ""
echo "请输入以下配置信息（直接回车使用默认值）："
echo ""

# API 地址配置
echo -e "${YELLOW}[1/3] API 服务器地址${NC}"
echo "  说明: 您的 NewAPI 或其他兼容服务器地址"
read -p "  请输入 (默认: https://newapi.com): " input_api_url
MODAI_API_BASE_URL="${input_api_url:-https://newapi.com}"
echo -e "${GREEN}  ✓ 已设置: ${MODAI_API_BASE_URL}${NC}"
echo ""

# 思考模型配置
echo -e "${YELLOW}[2/3] 思考模型${NC}"
echo "  说明: 用于复杂推理和分析的模型"
read -p "  请输入 (默认: gemini-2.5-pro): " input_thinking_model
MODAI_DEFAULT_THINKING_MODEL="${input_thinking_model:-gemini-2.5-pro}"
echo -e "${GREEN}  ✓ 已设置: ${MODAI_DEFAULT_THINKING_MODEL}${NC}"
echo ""

# 任务模型配置
echo -e "${YELLOW}[3/3] 任务模型${NC}"
echo "  说明: 用于快速执行任务的模型"
read -p "  请输入 (默认: gemini-2.5-flash): " input_task_model
MODAI_DEFAULT_TASK_MODEL="${input_task_model:-gemini-2.5-flash}"
echo -e "${GREEN}  ✓ 已设置: ${MODAI_DEFAULT_TASK_MODEL}${NC}"
echo ""

# ============================================

echo -e "${BLUE}配置摘要:${NC}"
echo "----------------------------------------"
echo "  镜像名称: ${FULL_IMAGE}"
echo "  API 地址: ${MODAI_API_BASE_URL}"
echo "  思考模型: ${MODAI_DEFAULT_THINKING_MODEL}"
echo "  任务模型: ${MODAI_DEFAULT_TASK_MODEL}"
echo ""
echo -e "${RED}⚠ 警告: API 地址将写入镜像，请确认后再分发！${NC}"
echo ""

read -p "确认开始构建？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消构建"
    exit 0
fi

echo ""
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

echo -e "${YELLOW}[2/4] 开始构建分发版镜像...${NC}"
echo "----------------------------------------"
echo "  镜像名称: ${FULL_IMAGE}"
echo "  构建模式: 分发版 (Distribution Mode)"
echo "  功能特性:"
echo "    - ✓ 只支持 Modai 提供商"
echo "    - ✓ API URL 预配置（不可见）"
echo "    - ✓ 模型预配置（不可见）"
echo "    - ✓ 精简 UI，只保留 API 密钥输入"
echo "    - ✓ 适合定制分发"
echo ""

# 构建分发版
docker build \
  --no-cache \
  --build-arg CLOSED_SOURCE_MODE=true \
  --build-arg MODAI_API_BASE_URL="${MODAI_API_BASE_URL}" \
  --build-arg MODAI_DEFAULT_THINKING_MODEL="${MODAI_DEFAULT_THINKING_MODEL}" \
  --build-arg MODAI_DEFAULT_TASK_MODEL="${MODAI_DEFAULT_TASK_MODEL}" \
  --tag ${FULL_IMAGE} \
  .

echo -e "${GREEN}✓ 镜像构建完成${NC}"
echo ""

echo -e "${YELLOW}[3/4] 验证镜像...${NC}"
echo "----------------------------------------"
docker images | grep ${IMAGE_NAME}
echo ""

# 验证环境变量是否正确注入
echo "  验证构建参数..."
TEMP_CONTAINER=$(docker create ${FULL_IMAGE})
ENV_CHECK=$(docker inspect ${TEMP_CONTAINER} | grep -i "NEXT_PUBLIC_CLOSED_SOURCE_MODE" || echo "未找到")
docker rm ${TEMP_CONTAINER} >/dev/null 2>&1

if [[ $ENV_CHECK == *"未找到"* ]]; then
    echo -e "${RED}  ⚠ 警告: 未能验证环境变量注入${NC}"
else
    echo -e "${GREEN}  ✓ 环境变量注入成功${NC}"
fi
echo ""

echo -e "${YELLOW}[4/4] 构建信息${NC}"
echo "----------------------------------------"
echo "  镜像名称: ${FULL_IMAGE}"
echo "  构建时间: $(date)"
echo "  镜像大小: $(docker images ${FULL_IMAGE} --format '{{.Size}}')"
echo "  配置状态: 分发模式已启用"
echo ""

echo -e "${GREEN}=========================================="
echo "  ✓ 分发版构建成功！"
echo "==========================================${NC}"
echo ""
echo "下一步操作："
echo ""
echo "1. 测试运行容器:"
echo "   docker run -d -p 3333:3000 --name ${IMAGE_NAME} ${FULL_IMAGE}"
echo ""
echo "2. 访问应用:"
echo "   http://localhost:3333"
echo "   应该只显示 API 密钥输入框"
echo ""
echo "3. 验证分发模式:"
echo "   - 不应显示 Mode 选择器"
echo "   - Provider 只显示 \"Mod AI Studio\""
echo "   - 不应显示 API URL 输入框"
echo "   - 不应显示模型选择器"
echo ""
echo "4. 导出镜像（用于分发）:"
echo "   docker save ${FULL_IMAGE} | gzip > deep-research-closed.tar.gz"
echo ""
echo "5. 查看日志:"
echo "   docker logs -f ${IMAGE_NAME}"
echo ""
echo -e "${RED}安全提示:${NC}"
echo "  - 此镜像包含预配置的 API 地址"
echo "  - 分发前请确认 API 地址是否可公开"
echo "  - 不要将此构建脚本提交到公开仓库"
echo ""
