# ================================
# 后端 Dockerfile (优化版 - 使用国内镜像源)
# ================================

FROM python:3.11-slim AS backend

WORKDIR /app

# 使用阿里云 Debian 镜像源加速（适用于中国大陆）
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

# 更新包列表并安装基础工具
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js (用于 JS 逆向)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 安装 FFmpeg 和时区数据
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    tzdata \
    && ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 使用阿里云 PyPI 镜像加速
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set install.trusted-host mirrors.aliyun.com

# 复制后端依赖文件
COPY server/requirements.txt ./server/

# 安装 Python 依赖
RUN pip install --no-cache-dir -r server/requirements.txt

# 复制后端代码
COPY server/ ./server/


# 创建必要的目录
RUN mkdir -p storage logs downloads backup_config

# 暴露端口
EXPOSE 8000

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Shanghai
ENV PYTHONPATH=/app/server

# 启动后端服务
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
