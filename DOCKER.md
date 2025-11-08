# Deep Research Docker 部署指南

本文档介绍如何使用 Docker 和 Docker Compose 部署 Deep Research 应用。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 🚀 快速开始

### 1. 配置环境变量

复制 `.env.example` 到 `.env` 并配置您的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少配置以下内容：

```env
# Google AI Studio API Key (必填)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# 或者配置 Mod AI Studio (NewAPI.ai)
# MODAI_API_KEY=your_newapi_key
# MODAI_API_BASE_URL=https://your-newapi-server.com

# 或者配置 OpenAI
# OPENAI_API_KEY=your_openai_key
```

### 2. 构建镜像

使用提供的脚本快速构建：

```bash
./docker-build.sh
```

或者手动构建：

```bash
docker-compose build
```

### 3. 启动应用

使用脚本启动：

```bash
./docker-run.sh
```

或者手动启动：

```bash
docker-compose up -d
```

### 4. 访问应用

在浏览器中打开：**http://localhost:3333**

## 🔒 闭源模式部署 (Closed Source Mode)

闭源模式允许您构建一个精简版本，隐藏多余的配置选项，只保留 API 密钥输入：

### 特性

- ✅ 隐藏 Mode 选择器 (proxy/local)
- ✅ 只显示 Mod AI 提供商
- ✅ 隐藏 API URL 配置（在构建时预设）
- ✅ 隐藏模型选择器（使用预设模型）
- ✅ 用户界面极简，只需输入 API 密钥

### 构建闭源版镜像

**方式 1：使用 docker build 命令**

```bash
docker build \
  --build-arg CLOSED_SOURCE_MODE=true \
  --build-arg MODAI_API_BASE_URL=https://your-api-server.com \
  --build-arg MODAI_DEFAULT_THINKING_MODEL=gemini-2.5-pro \
  --build-arg MODAI_DEFAULT_TASK_MODEL=gemini-2.5-flash \
  -t deep-research:closed \
  .
```

**方式 2：使用 docker-compose.yml**

编辑 `docker-compose.yml`，取消注释 build args 部分：

```yaml
services:
  deep-research:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - CLOSED_SOURCE_MODE=true
        - MODAI_API_BASE_URL=https://your-api-server.com
        - MODAI_DEFAULT_THINKING_MODEL=gemini-2.5-pro
        - MODAI_DEFAULT_TASK_MODEL=gemini-2.5-flash
    image: deep-research:closed
    # ... 其他配置
```

然后构建：

```bash
docker-compose build
docker-compose up -d
```

### 构建参数说明

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `CLOSED_SOURCE_MODE` | 是 | `false` | 启用分发模式 |
| `MODAI_API_BASE_URL` | 是 | 无 | 您的 API 服务器地址 |
| `MODAI_DEFAULT_THINKING_MODEL` | 否 | `gemini-2.5-pro` | 默认思考模型 |
| `MODAI_DEFAULT_TASK_MODEL` | 否 | `gemini-2.5-flash` | 默认任务模型 |

### 分发提示

- ✅ 源代码完全开源
- ✅ API 地址不在源码中，仅在镜像中
- ✅ 构建时通过环境变量传入
- ✅ 适合定制分发（预配置部署）
- ⚠️ 请妥善保管包含 API 地址的构建脚本
- 📝 这是"预配置的开源软件"，不是闭源软件

## 📝 常用命令

### 查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100
```

### 查看容器状态

```bash
docker-compose ps
```

### 停止应用

```bash
# 使用脚本（推荐）
./docker-stop.sh

# 或者手动停止
docker-compose stop
```

### 重启应用

```bash
docker-compose restart
```

### 停止并删除容器

```bash
# 保留数据卷
docker-compose down

# 删除所有（包括数据卷）
docker-compose down -v
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
./docker-build.sh

# 3. 重启容器
docker-compose up -d
```

## 🔧 配置说明

### docker-compose.yml 配置

默认配置说明：

```yaml
ports:
  - "3333:3000"  # 主机端口:容器端口
                 # 可以修改 3333 为其他端口

restart: unless-stopped  # 自动重启策略

volumes:
  - deep-research-data:/app/.next/cache  # 持久化缓存数据
```

### 自定义端口

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8080:3000"  # 改为 8080 端口
```

### 环境变量

所有环境变量都通过 `.env` 文件配置，支持的变量包括：

```env
# AI Provider 配置
GOOGLE_GENERATIVE_AI_API_KEY=xxx
MODAI_API_KEY=xxx
MODAI_API_BASE_URL=xxx
OPENAI_API_KEY=xxx

# 搜索服务配置
TAVILY_API_KEY=xxx
EXA_API_KEY=xxx

# 其他配置
NODE_ENV=production
NEXT_PUBLIC_BUILD_MODE=standalone
```

## 🏗️ 生产环境部署

### 使用 Docker 镜像

构建完成后，可以将镜像导出或推送到镜像仓库：

```bash
# 导出镜像
docker save deep-research:latest > deep-research.tar

# 在其他机器上导入
docker load < deep-research.tar

# 推送到 Docker Hub
docker tag deep-research:latest your-username/deep-research:latest
docker push your-username/deep-research:latest
```

### 使用反向代理 (Nginx)

推荐在生产环境中使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 启用 HTTPS

使用 Let's Encrypt 和 Certbot：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 🐛 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查容器状态
docker-compose ps

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 内存不足

修改 Docker Desktop 的内存限制，或在 `docker-compose.yml` 中添加：

```yaml
services:
  deep-research:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3333  # macOS/Linux
netstat -ano | findstr :3333  # Windows

# 修改 docker-compose.yml 中的端口
```

### 权限问题

```bash
# 给脚本添加执行权限
chmod +x docker-*.sh

# 如果 Docker 需要 sudo
sudo docker-compose up -d
```

## 📊 健康检查

应用包含内置的健康检查功能：

```bash
# 检查应用健康状态
curl http://localhost:3333/

# 查看 Docker 健康状态
docker inspect --format='{{json .State.Health}}' deep-research
```

## 🔐 安全建议

1. **不要将 `.env` 文件提交到 Git**
2. **定期更新 Docker 镜像**: `docker-compose pull && docker-compose up -d`
3. **使用强密码和 API 密钥**
4. **在生产环境中启用 HTTPS**
5. **限制容器资源使用**
6. **定期备份数据卷**: `docker run --rm -v deep-research-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data`

## 📈 性能优化

### 构建缓存

Docker 会自动缓存构建层，加速后续构建。清理缓存：

```bash
docker builder prune
```

### 多阶段构建

Dockerfile 已经使用多阶段构建优化镜像大小。

### 镜像大小

查看镜像大小：

```bash
docker images deep-research
```

## 🆘 获取帮助

- 查看应用日志：`docker-compose logs -f`
- 查看容器信息：`docker inspect deep-research`
- GitHub Issues: [项目地址]
- 文档：[项目文档地址]

## 📚 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

---

**注意**: 首次构建可能需要 5-10 分钟，取决于您的网络速度和机器性能。后续构建会利用缓存，速度会快很多。
