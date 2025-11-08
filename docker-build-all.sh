#!/bin/bash

###############################################################################
# Deep Research - 通用构建脚本
#
# 功能：
# - 支持构建开源版和闭源版
# - 清理 Docker 构建缓存
# - 交互式选择构建类型
#
# 使用方法：
#   chmod +x docker-build-all.sh
#   ./docker-build-all.sh [opensource|closed]
#
# 或交互式运行：
#   ./docker-build-all.sh
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 分发版默认配置
# ============================================
DEFAULT_MODAI_API_BASE_URL="https://newapi.com"
DEFAULT_MODAI_THINKING_MODEL="gemini-2.5-pro"
DEFAULT_MODAI_TASK_MODEL="gemini-2.5-flash"
# ============================================

function show_banner() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Deep Research - Docker 构建工具"
    echo "=========================================="
    echo -e "${NC}"
}

function clean_docker() {
    local image_name=$1
    local image_tag=$2
    local full_image="${image_name}:${image_tag}"

    echo -e "${YELLOW}清理 Docker 环境...${NC}"
    echo "----------------------------------------"

    # 停止并删除旧容器
    if docker ps -a | grep -q "${image_name}"; then
        echo "  停止容器: ${image_name}"
        docker stop ${image_name} 2>/dev/null || true
        docker rm ${image_name} 2>/dev/null || true
    fi

    # 删除旧镜像
    if docker images | grep -q "${image_name}.*${image_tag}"; then
        echo "  删除镜像: ${full_image}"
        docker rmi ${full_image} 2>/dev/null || true
    fi

    # 清理构建缓存
    echo "  清理构建缓存..."
    docker builder prune -f

    echo -e "${GREEN}✓ 清理完成${NC}"
    echo ""
}

function build_opensource() {
    local image_name="deep-research"
    local image_tag="opensource"
    local full_image="${image_name}:${image_tag}"

    show_banner
    echo -e "${BLUE}构建类型: 开源版 (Open Source)${NC}"
    echo ""

    clean_docker ${image_name} ${image_tag}

    echo -e "${YELLOW}开始构建开源版...${NC}"
    echo "----------------------------------------"
    echo "  镜像: ${full_image}"
    echo "  特性: 完整功能，所有提供商"
    echo ""

    docker build \
      --no-cache \
      --build-arg CLOSED_SOURCE_MODE=false \
      --tag ${full_image} \
      --tag ${image_name}:latest \
      .

    echo ""
    echo -e "${GREEN}✓ 开源版构建成功！${NC}"
    echo ""
    echo "镜像信息:"
    docker images | grep ${image_name} | head -2
    echo ""
    echo "启动命令:"
    echo "  docker run -d -p 3333:3000 --name ${image_name} ${full_image}"
    echo ""
}

function build_closed() {
    local image_name="deep-research"
    local image_tag="closed"
    local full_image="${image_name}:${image_tag}"

    show_banner
    echo -e "${BLUE}构建类型: 分发版 (Distribution Mode)${NC}"
    echo ""
    echo "请输入配置信息（直接回车使用默认值）："
    echo ""

    # API 地址配置
    echo -e "${YELLOW}[1/3] API 服务器地址${NC}"
    read -p "  请输入 (默认: ${DEFAULT_MODAI_API_BASE_URL}): " input_api_url
    local MODAI_API_BASE_URL="${input_api_url:-$DEFAULT_MODAI_API_BASE_URL}"
    echo -e "${GREEN}  ✓ 已设置: ${MODAI_API_BASE_URL}${NC}"
    echo ""

    # 思考模型配置
    echo -e "${YELLOW}[2/3] 思考模型${NC}"
    read -p "  请输入 (默认: ${DEFAULT_MODAI_THINKING_MODEL}): " input_thinking_model
    local MODAI_DEFAULT_THINKING_MODEL="${input_thinking_model:-$DEFAULT_MODAI_THINKING_MODEL}"
    echo -e "${GREEN}  ✓ 已设置: ${MODAI_DEFAULT_THINKING_MODEL}${NC}"
    echo ""

    # 任务模型配置
    echo -e "${YELLOW}[3/3] 任务模型${NC}"
    read -p "  请输入 (默认: ${DEFAULT_MODAI_TASK_MODEL}): " input_task_model
    local MODAI_DEFAULT_TASK_MODEL="${input_task_model:-$DEFAULT_MODAI_TASK_MODEL}"
    echo -e "${GREEN}  ✓ 已设置: ${MODAI_DEFAULT_TASK_MODEL}${NC}"
    echo ""

    echo -e "${YELLOW}配置摘要:${NC}"
    echo "  API 地址: ${MODAI_API_BASE_URL}"
    echo "  思考模型: ${MODAI_DEFAULT_THINKING_MODEL}"
    echo "  任务模型: ${MODAI_DEFAULT_TASK_MODEL}"
    echo ""
    echo -e "${RED}⚠ 警告: API 地址将写入镜像，请确认后再分发！${NC}"
    echo ""

    read -p "确认构建分发版？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消构建"
        exit 0
    fi

    echo ""
    clean_docker ${image_name} ${image_tag}

    echo -e "${YELLOW}开始构建闭源版...${NC}"
    echo "----------------------------------------"
    echo "  镜像: ${full_image}"
    echo "  特性: 精简UI，预配置API"
    echo ""

    docker build \
      --no-cache \
      --build-arg CLOSED_SOURCE_MODE=true \
      --build-arg MODAI_API_BASE_URL="${MODAI_API_BASE_URL}" \
      --build-arg MODAI_DEFAULT_THINKING_MODEL="${MODAI_DEFAULT_THINKING_MODEL}" \
      --build-arg MODAI_DEFAULT_TASK_MODEL="${MODAI_DEFAULT_TASK_MODEL}" \
      --tag ${full_image} \
      .

    echo ""
    echo -e "${GREEN}✓ 闭源版构建成功！${NC}"
    echo ""
    echo "镜像信息:"
    docker images | grep ${image_name} | head -1
    echo ""
    echo "启动命令:"
    echo "  docker run -d -p 3333:3000 --name ${image_name} ${full_image}"
    echo ""
    echo "导出镜像:"
    echo "  docker save ${full_image} | gzip > deep-research-closed.tar.gz"
    echo ""
}

function interactive_menu() {
    show_banner
    echo "请选择构建类型:"
    echo ""
    echo "  1) 开源版 (Open Source)"
    echo "     - 完整功能"
    echo "     - 支持所有 AI 提供商"
    echo "     - 用户可配置所有选项"
    echo ""
    echo "  2) 分发版 (Distribution Mode)"
    echo "     - 精简UI"
    echo "     - 只支持 Modai"
    echo "     - API地址预配置"
    echo "     - 交互式配置"
    echo ""
    echo "  3) 同时构建两个版本"
    echo ""
    echo "  0) 退出"
    echo ""
    read -p "请输入选项 (0-3): " -n 1 -r
    echo
    echo ""

    case $REPLY in
        1)
            build_opensource
            ;;
        2)
            build_closed
            ;;
        3)
            build_opensource
            echo ""
            echo "=========================================="
            echo ""
            build_closed
            ;;
        0)
            echo "退出"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项${NC}"
            exit 1
            ;;
    esac
}

# 主程序
if [ $# -eq 0 ]; then
    # 无参数 - 交互式菜单
    interactive_menu
elif [ "$1" == "opensource" ] || [ "$1" == "open" ]; then
    build_opensource
elif [ "$1" == "closed" ]; then
    build_closed
elif [ "$1" == "all" ]; then
    build_opensource
    echo ""
    echo "=========================================="
    echo ""
    build_closed
else
    echo "用法: $0 [opensource|closed|all]"
    echo ""
    echo "或直接运行进入交互式菜单:"
    echo "  $0"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  构建完成！"
echo "==========================================${NC}"
echo ""
echo "查看所有镜像:"
echo "  docker images | grep deep-research"
echo ""
