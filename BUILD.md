# Deep Research 构建指南

本文档提供开源版和闭源版的完整构建命令。

## 📦 构建脚本说明

项目提供了三个构建脚本：

| 脚本 | 用途 | 使用场景 |
|------|------|----------|
| `docker-build-opensource.sh` | 构建开源版 | 需要完整功能的部署 |
| `docker-build-closed.sh` | 构建闭源版 | 需要精简UI的闭源分发 |
| `docker-build-all.sh` | 交互式构建 | 同时管理两个版本 |

## 🚀 快速开始

### 方式 1: 使用构建脚本（推荐）

```bash
# 赋予执行权限
chmod +x docker-build-*.sh

# 开源版
./docker-build-opensource.sh

# 闭源版
./docker-build-closed.sh

# 交互式选择
./docker-build-all.sh
```

### 方式 2: 直接使用 Docker 命令

#### 开源版构建

```bash
# 清理旧镜像和缓存
docker stop deep-research 2>/dev/null || true
docker rm deep-research 2>/dev/null || true
docker rmi deep-research:opensource 2>/dev/null || true
docker builder prune -f

# 构建开源版
docker build \
  --no-cache \
  --build-arg CLOSED_SOURCE_MODE=false \
  --tag deep-research:opensource \
  --tag deep-research:latest \
  .

# 验证
docker images | grep deep-research
```

#### 闭源版构建

```bash
# 清理旧镜像和缓存
docker stop deep-research 2>/dev/null || true
docker rm deep-research 2>/dev/null || true
docker rmi deep-research:closed 2>/dev/null || true
docker builder prune -f

# 构建闭源版（⚠️ 请替换为您的实际配置）
docker build \
  --no-cache \
  --build-arg CLOSED_SOURCE_MODE=true \
  --build-arg MODAI_API_BASE_URL=https://off.092420.xyz \
  --build-arg MODAI_DEFAULT_THINKING_MODEL=gemini-2.5-pro \
  --build-arg MODAI_DEFAULT_TASK_MODEL=gemini-2.5-flash \
  --tag deep-research:closed \
  .

# 验证
docker images | grep deep-research
```

## 🔧 构建参数说明

### 必需参数（闭源版）

| 参数 | 说明 | 示例 |
|------|------|------|
| `CLOSED_SOURCE_MODE` | 启用闭源模式 | `true` 或 `false` |
| `MODAI_API_BASE_URL` | API 服务器地址 | `https://off.092420.xyz` |

### 可选参数（闭源版）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `MODAI_DEFAULT_THINKING_MODEL` | `gemini-2.5-pro` | 默认思考模型 |
| `MODAI_DEFAULT_TASK_MODEL` | `gemini-2.5-flash` | 默认任务模型 |

## 📝 使用 docker-compose 构建

### 开源版 docker-compose

```yaml
version: "3.9"
services:
  deep-research:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - CLOSED_SOURCE_MODE=false
    image: deep-research:opensource
    container_name: deep-research
    ports:
      - "3333:3000"
    env_file:
      - .env
```

构建命令：
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 闭源版 docker-compose

```yaml
version: "3.9"
services:
  deep-research:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - CLOSED_SOURCE_MODE=true
        - MODAI_API_BASE_URL=https://off.092420.xyz
        - MODAI_DEFAULT_THINKING_MODEL=gemini-2.5-pro
        - MODAI_DEFAULT_TASK_MODEL=gemini-2.5-flash
    image: deep-research:closed
    container_name: deep-research
    ports:
      - "3333:3000"
    env_file:
      - .env
```

构建命令：
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 🧪 构建后测试

### 开源版验证

```bash
# 运行容器
docker run -d -p 3333:3000 --name deep-research deep-research:opensource

# 访问 http://localhost:3333
# 检查设置页面应该显示：
# ✓ Mode 选择器 (local/proxy)
# ✓ 多个 Provider 选项
# ✓ API URL 输入框
# ✓ 模型选择器
```

### 闭源版验证

```bash
# 运行容器
docker run -d -p 3333:3000 --name deep-research deep-research:closed

# 访问 http://localhost:3333
# 检查设置页面应该只显示：
# ✓ API Key 输入框
# ✗ 不显示 Mode 选择器
# ✗ 只显示 "Mod AI Studio"
# ✗ 不显示 API URL 输入框
# ✗ 不显示模型选择器
```

## 📤 导出和分发镜像

### 导出开源版

```bash
# 保存为压缩文件
docker save deep-research:opensource | gzip > deep-research-opensource.tar.gz

# 传输到其他服务器后导入
gunzip -c deep-research-opensource.tar.gz | docker load
```

### 导出闭源版

```bash
# 保存为压缩文件
docker save deep-research:closed | gzip > deep-research-closed.tar.gz

# 传输到其他服务器后导入
gunzip -c deep-research-closed.tar.gz | docker load

# ⚠️ 安全提示：
# - 此镜像包含预配置的 API 地址
# - 确认 API 地址可以公开后再分发
# - 不要将构建脚本提交到公开仓库
```

## 🔍 常见问题

### 1. 构建失败：pnpm not found

**原因：** Dockerfile 的 builder 阶段缺少 pnpm

**解决：** 确保 Dockerfile 包含以下内容（已在最新版本中修复）：
```dockerfile
# Install pnpm for build stage
RUN yarn global add pnpm
```

### 2. 闭源版仍然显示多个 Provider

**原因：** 构建参数未正确传入

**解决：** 确保使用 `--no-cache` 重新构建：
```bash
docker build --no-cache --build-arg CLOSED_SOURCE_MODE=true ...
```

### 3. API 地址未生效

**原因：** 环境变量优先级问题

**解决：** 检查环境变量注入：
```bash
docker inspect deep-research:closed | grep NEXT_PUBLIC_MODAI
```

### 4. 清理所有镜像和容器

```bash
# 停止所有容器
docker stop deep-research 2>/dev/null || true

# 删除所有容器
docker rm deep-research 2>/dev/null || true

# 删除所有 deep-research 镜像
docker rmi $(docker images | grep deep-research | awk '{print $3}') 2>/dev/null || true

# 清理所有未使用的资源
docker system prune -a -f
```

## 📊 版本对比

| 特性 | 开源版 | 闭源版 |
|------|--------|--------|
| **UI 复杂度** | 完整 | 精简 |
| **Mode 选择器** | ✅ 显示 | ❌ 隐藏 |
| **Provider 选择** | ✅ 所有提供商 | ❌ 只有 Modai |
| **API URL 配置** | ✅ 用户可配置 | ❌ 构建时预设 |
| **模型选择** | ✅ 用户可选择 | ❌ 构建时预设 |
| **API Key 输入** | ✅ 显示 | ✅ 显示 |
| **适用场景** | 开源分发 | 闭源分发 |
| **镜像大小** | 相同 | 相同 |

## 🔐 安全建议

### 开源版

- ✅ 可以公开分发
- ✅ 可以提交到公开仓库
- ✅ 用户自行配置 API

### 闭源版

- ⚠️ API 地址写入镜像
- ⚠️ 构建脚本包含敏感信息
- ⚠️ 不要提交构建脚本到公开仓库
- ✅ 适合内部分发
- ✅ 用户只需提供 API Key

## 📚 相关文档

- [DOCKER.md](./DOCKER.md) - 详细的 Docker 部署指南
- [README.md](./README.md) - 项目说明文档
- [.env.example](./.env.example) - 环境变量示例

## 🆘 获取帮助

如果遇到构建问题：

1. 检查 Docker 版本：`docker --version`（需要 20.10+）
2. 检查磁盘空间：`df -h`（需要 5GB+）
3. 查看构建日志：`docker build ... 2>&1 | tee build.log`
4. 清理并重试：`docker system prune -a -f && ./docker-build-all.sh`

---

**最后更新：** $(date +%Y-%m-%d)
