# 🐳 Docker 部署指南

本文档介绍如何使用 Docker 部署 AI-Live-Review 项目。

## 📋 前置要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **磁盘空间**: 至少 5GB 可用空间

## 🚀 快速开始

### 1. 配置环境变量

虽然可以设置 `.env`，但推荐在启动后的 Web 界面 "Settings" 中配置 API Key。

```bash
# 创建 .env 文件（可选）
touch .env
```

### 2. 构建并启动服务

```bash
# 构建镜像并启动所有服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend
```

### 3. 访问应用

- **前端界面**: http://localhost:8080
- **后端 API**: http://localhost:8001
- **API 文档**: http://localhost:8001/docs (或通过 Nginx http://localhost:8080/docs)

## 📦 Docker 架构

### 服务组成

```
┌─────────────────────────────────────────┐
│           Nginx (Port 80 -> 8080)       │
│  - 前端静态文件服务                        │
│  - API 反向代理                           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      FastAPI Backend (Port 8000 -> 8001)│
│  - 任务调度                               │
│  - 直播录制                               │
│  - AI 分析                                │
└─────────────────────────────────────────┘
```

### 数据持久化

以下目录通过 Docker Volume 持久化：

- `./storage` - 录制视频文件
- `./logs` - 应用日志
- `./downloads` - 下载文件
- `./config` - 配置文件（包括数据库）

## 🛠️ 常用命令

### 启动和停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 停止并删除所有数据（谨慎使用！）
docker-compose down -v
```

### 查看状态

```bash
# 查看运行状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f [service_name]
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 只重启 Nginx
docker-compose restart nginx
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend bash

# 进入 Nginx 容器
docker-compose exec nginx sh
```

## 🔧 配置说明

### 环境变量

在 `.env` 文件中配置（可选）：

```env
# 可选配置
TZ=Asia/Shanghai
PYTHONUNBUFFERED=1
```

### 端口映射

默认端口映射：

- `8080:80` - Nginx (前端 + API 代理)
- `8001:8000` - FastAPI 后端（直接访问）

如需修改端口，编辑 `docker-compose.yml`：

```yaml
services:
  nginx:
    ports:
      - "80:80"  # 将前端映射回 80 端口
```

## 🐛 故障排除

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose logs backend

# 检查容器状态
docker-compose ps
```

### 2. 前端无法访问后端

检查 Nginx 配置：

```bash
# 测试 Nginx 配置
docker-compose exec nginx nginx -t

# 重新加载 Nginx
docker-compose exec nginx nginx -s reload
```

### 3. 数据库文件权限问题

```bash
# 修复权限
chmod 666 database.db
```

### 4. FFmpeg 相关错误

FFmpeg 已包含在 Docker 镜像中，如果遇到问题：

```bash
# 进入容器检查
docker-compose exec backend ffmpeg -version
```

### 5. 清理和重建

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi ai-review-backend

# 清理构建缓存
docker builder prune

# 重新构建
docker-compose up -d --build
```

## 📊 性能优化

### 1. 限制资源使用

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 2. 使用外部数据库

对于生产环境，建议使用 PostgreSQL：

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_live_review
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## 🔒 安全建议

1. **不要提交 `.env` 文件到 Git**
2. **使用强密码和安全的 API Key**
3. **在生产环境启用 HTTPS**
4. **定期更新 Docker 镜像**
5. **限制容器权限**

## 📈 生产部署

### 使用 HTTPS

1. 安装 Certbot
2. 获取 SSL 证书
3. 修改 `nginx.conf` 添加 SSL 配置

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他配置
}
```

### 使用反向代理

如果已有 Nginx/Caddy，可以只运行后端：

```bash
# 只启动后端
docker-compose up -d backend
```

然后在主 Nginx 中配置代理：

```nginx
location / {
    proxy_pass http://localhost:8000;
}
```

## 🔄 更新和维护

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 查看新版本日志
docker-compose logs -f
```

### 备份数据

```bash
# 备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_${DATE}.tar.gz \
    database.db \
    storage/ \
    config/ \
    .env
```

### 恢复数据

```bash
# 停止服务
docker-compose down

# 恢复文件
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# 重启服务
docker-compose up -d
```

## 📞 获取帮助

如遇到问题：

1. 查看日志: `docker-compose logs -f`
2. 检查容器状态: `docker-compose ps`
3. 查看资源使用: `docker stats`
4. 提交 Issue: [GitHub Issues](https://github.com/baifan11/AI-Live-Review/issues)

---

**提示**: 首次构建可能需要 5-10 分钟，请耐心等待。
