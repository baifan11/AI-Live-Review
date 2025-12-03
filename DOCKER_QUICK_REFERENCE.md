# 🐳 Docker 快速参考

## 📁 Docker 相关文件

| 文件 | 说明 |
|------|------|
| `Dockerfile` | Docker 镜像构建文件（多阶段构建） |
| `docker-compose.yml` | Docker Compose 配置文件 |
| `nginx.conf` | Nginx 反向代理配置 |
| `.dockerignore` | Docker 构建时忽略的文件 |
| `docker-start.sh` | 一键启动脚本 |
| `docker-test.sh` | 配置验证脚本 |
| `DOCKER_DEPLOYMENT.md` | 详细部署文档 |

## 🚀 快速命令

### 启动服务

```bash
# 方式 1: 使用启动脚本（推荐）
./docker-start.sh

# 方式 2: 手动启动
docker-compose up -d --build

# 方式 3: 前台运行（查看日志）
docker-compose up --build
```

### 停止服务

```bash
# 停止服务（保留数据）
docker-compose down

# 停止并删除所有数据（谨慎！）
docker-compose down -v
```

### 查看状态

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 只看 Nginx 日志
docker-compose logs -f nginx

# 查看资源使用
docker stats
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

# 在后端容器中执行命令
docker-compose exec backend python --version
```

### 清理和维护

```bash
# 查看镜像
docker images

# 删除项目镜像
docker rmi ai-review-backend

# 清理未使用的镜像
docker image prune

# 清理构建缓存
docker builder prune

# 查看磁盘使用
docker system df

# 清理所有未使用的资源
docker system prune -a
```

## 🔧 常见操作

### 更新代码后重新部署

```bash
git pull
docker-compose up -d --build
```

### 只重新构建后端

```bash
docker-compose build backend
docker-compose up -d backend
```

### 查看特定时间的日志

```bash
# 查看最近 100 行
docker-compose logs --tail=100

# 查看最近 5 分钟的日志
docker-compose logs --since 5m
```

### 导出和导入镜像

```bash
# 导出镜像
docker save -o ai-review-backend.tar ai-review-backend

# 导入镜像
docker load -i ai-review-backend.tar
```

### 备份数据

```bash
# 备份数据库和存储
tar -czf backup_$(date +%Y%m%d).tar.gz \
    database.db \
    storage/ \
    config/ \
    .env
```

## 🐛 故障排除

### 端口被占用

```bash
# 查看端口占用
lsof -i :80
lsof -i :8000

# 修改端口（编辑 docker-compose.yml）
ports:
  - "8080:80"  # 改为 8080
```

### 容器无法启动

```bash
# 查看详细错误
docker-compose logs backend

# 检查配置
docker-compose config

# 验证 Dockerfile
docker-compose build --no-cache
```

### 清理后重新开始

```bash
# 完全清理
docker-compose down -v
docker system prune -a

# 重新构建
docker-compose up -d --build
```

### 数据库权限问题

```bash
# 修复权限
chmod 666 database.db
chown $(whoami):$(whoami) database.db
```

## 📊 性能监控

```bash
# 实时监控资源使用
docker stats

# 查看容器详细信息
docker-compose exec backend top

# 查看磁盘使用
docker-compose exec backend df -h
```

## 🔒 安全提示

- ✅ 不要提交 `.env` 文件
- ✅ 定期更新 Docker 镜像
- ✅ 使用非 root 用户运行容器
- ✅ 限制容器资源使用
- ✅ 在生产环境启用 HTTPS

## 📖 更多信息

- 详细文档: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- 项目文档: [README.md](README.md)
- Docker 官方文档: https://docs.docker.com/
