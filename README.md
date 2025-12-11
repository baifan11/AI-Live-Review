# 🎥 AI-Live-Review

> 直播录制与AI分析平台 - Live Stream Recording and AI Analysis Platform

一个基于 FastAPI + React 的智能直播录制与分析系统，支持多平台直播录制、AI 语音转写、视觉分析和智能报告生成。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.100+-009688.svg)](https://fastapi.tiangolo.com/)

---

## ✨ 核心功能

### 📹 直播录制
- ✅ **多平台支持**：抖音、快手、B站、淘宝等主流直播平台
- ✅ **智能调度**：基于 APScheduler 的定时录制任务
- ✅ **灵活配置**：自定义录制间隔、时长、循环次数
- ✅ **自动停止**：支持设置最大录制段数，达到后自动停止
- ✅ **任务控制**：暂停、恢复、停止任务

### 🤖 AI 分析
- ✅ **语音转写**：基于阿里云 DashScope ASR 的高精度语音识别
- ✅ **视觉分析**：自动提取关键帧并进行视觉内容分析
- ✅ **智能报告**：结合转写和视觉分析生成综合评估报告
- ✅ **自定义 Prompt**：支持为每个任务配置专属的 AI 分析提示词

### 📊 数据管理
- ✅ **记录追踪**：完整的录制历史和状态管理
- ✅ **主播管理**：按主播分类管理录制记录
- ✅ **多格式导出**：
  - 视频下载（MP4）
  - 转写稿导出（TXT/Markdown）
  - 分析报告导出（TXT/Markdown）

### 🎨 用户界面
- ✅ **现代化设计**：基于 React + TailwindCSS 的响应式界面
- ✅ **实时更新**：使用 React Query 实现数据自动刷新
- ✅ **直观操作**：清晰的任务管理和记录查看界面
- ✅ **完整转写展示**：按语句显示转写内容，带时间戳

---

## 🏗️ 技术架构

### 后端技术栈
```
FastAPI          # Web 框架
SQLModel         # ORM（基于 SQLAlchemy + Pydantic）
APScheduler      # 任务调度
FFmpeg           # 视频处理
DashScope SDK    # 阿里云 AI 服务
```

### 前端技术栈
```
React 18         # UI 框架
TypeScript       # 类型安全
TailwindCSS      # 样式框架
React Query      # 数据获取和缓存
React Router     # 路由管理
Lucide Icons     # 图标库
```

### 核心模块

#### 后端模块
- **`server/main.py`**: FastAPI 应用主入口，API 路由定义
- **`server/scheduler.py`**: 任务调度器，管理录制任务生命周期
- **`server/database.py`**: 数据模型定义（Task, Record, Settings）
- **`server/services/`**: 核心服务层
  - `stream_fetcher.py`: 直播流获取（基于 DouyinLiveRecorder）
  - `recorder.py`: 录制服务（FFmpeg 封装）
  - `media_processor.py`: 媒体处理（音频提取、帧提取）
  - `ai_service.py`: AI 分析服务（ASR、视觉、报告生成）
  - `prompt_manager.py`: Prompt 模板管理

#### 前端模块
- **`web/src/pages/`**: 页面组件
  - `Dashboard.tsx`: 仪表盘，显示最近录制
  - `Tasks.tsx`: 任务管理页面
  - `Records.tsx`: 所有录制记录列表
  - `RecordDetail.tsx`: 录制详情（视频播放、转写、分析报告）
  - `Settings.tsx`: 系统设置
- **`web/src/lib/api.ts`**: API 客户端封装

---

## 🚀 快速开始

有两种方式启动项目：**Docker 部署（推荐）** 或 **本地开发部署**。

### 🐳 方式一：Docker 部署（推荐）

**最简单、最稳定的部署方式！**

#### 环境要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **阿里云 DashScope API Key**（用于 AI 分析）

#### 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/baifan11/AI-Live-Review.git
cd AI-Live-Review

# 2. 配置环境变量
echo "DASHSCOPE_API_KEY=your_api_key_here" > .env

# 3. 一键启动（使用启动脚本）
./docker-start.sh

# 或者手动启动
docker-compose up -d --build
```

#### 访问应用

- **前端界面**: http://localhost:8080
- **后端 API**: http://localhost:8001
- **API 文档**: http://localhost:8001/docs

#### 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

📖 **详细文档**: 查看 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) 了解更多

---

### 💻 方式二：本地开发部署

#### 环境要求

- **Python**: 3.8+
- **Node.js**: 16+
- **FFmpeg**: 4.0+
- **阿里云 DashScope API Key**（用于 AI 分析）

#### 1. 克隆项目

```bash
git clone https://github.com/baifan11/AI-Live-Review.git
cd AI-Live-Review
```

#### 2. 后端设置


```bash
# 创建虚拟环境
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
echo "DASHSCOPE_API_KEY=your_api_key_here" > ../.env

# 启动后端服务（注意：需要在 server 目录内启动）
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. 前端设置

```bash
# 新开终端窗口
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问应用

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

---

## 📖 使用指南

### 创建录制任务

1. 进入 **Tasks** 页面
2. 填写任务信息：
   - **直播 URL**: 直播间地址
   - **主播 ID**: 主播标识
   - **主播名称**: 主播昵称
   - **间隔时长**: 每次录制的间隔（秒）
   - **录制时长**: 单次录制的时长（秒）
   - **录制段数**: 最大录制次数（0 为无限制）
   - **启用 AI 分析**: 是否进行 AI 分析
3. 点击 **Create Task** 创建任务

### 查看录制记录

1. 在 **Dashboard** 查看最近的录制
2. 在 **Records** 查看所有历史记录
3. 点击 **查看详情** 进入详情页面

### 录制详情页面

- **视频播放**: 在线播放录制的视频
- **转写稿**: 查看完整的语音转写内容（按语句显示，带时间戳）
- **AI 分析报告**: 查看 AI 生成的分析报告
- **下载/导出**:
  - 下载视频（MP4）
  - 导出转写稿（TXT/Markdown）
  - 导出分析报告（TXT/Markdown）

### 系统设置

在 **Settings** 页面配置：
- **DashScope API Key**: 阿里云 AI 服务密钥
- **提示词**
---

## 📁 项目结构

```
AI-Live-Review/
├── server/                    # 后端代码
│   ├── main.py               # FastAPI 应用入口
│   ├── scheduler.py          # 任务调度器
│   ├── database.py           # 数据模型
│   ├── services/             # 服务层
│   │   ├── stream_fetcher.py
│   │   ├── recorder.py
│   │   ├── media_processor.py
│   │   ├── ai_service.py
│   │   └── prompt_manager.py
│   ├── src/                  # DouyinLiveRecorder 核心
│   └── config/               # 配置文件
├── web/                      # 前端代码
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── lib/             # 工具库
│   │   └── main.tsx         # 应用入口
│   └── package.json
├── storage/                  # 录制文件存储（gitignore）
├── .env                      # 环境变量（gitignore）
├── database.db              # SQLite 数据库（gitignore）
└── README.md
```

---

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：

```env
# 阿里云 DashScope API Key（必需，用于 AI 分析）
DASHSCOPE_API_KEY=your_dashscope_api_key

# 前端 API 地址（可选，默认 http://localhost:5173）
VITE_API_URL=http://localhost:8000
```

### 数据库

项目使用 SQLite 数据库，首次运行时会自动创建 `database.db` 文件。

**数据模型**：
- **Task**: 录制任务
- **Record**: 录制记录
- **Settings**: 系统设置

---

## 🎯 核心特性详解

### 1. 智能语句合并

转写结果会自动合并为完整语句，而不是逐字显示：

**原始输出**（词级别）：
```
[00:01] 大家
[00:02] 好
[00:03] 欢迎
```

**智能合并后**（句子级别）：
```
[00:01 - 00:05] 大家好，欢迎来到我的直播间。
```

### 2. 多格式导出

**转写稿 TXT 格式**：
```
[00:05 - 00:12] 大家好，欢迎来到我的直播间。
[00:13 - 00:20] 今天给大家带来的是我们的新品推荐。
```

**转写稿 Markdown 格式**：
```markdown
# 录制记录 #123 转写稿

**主播**: 小雨
**时间**: 2025-11-20 21:30:00

---

**[00:05 - 00:12]**

大家好，欢迎来到我的直播间。

**[00:13 - 00:20]**

今天给大家带来的是我们的新品推荐。
```

### 3. 任务自动停止

设置 `max_recordings` 后，任务会在达到指定录制次数后自动停止：

```python
# 示例：录制 5 次后自动停止
task.max_recordings = 5
```

---

## 🐛 故障排除

### 常见问题

#### 1. FFmpeg 未安装

**错误**: `FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`

**解决**:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# 下载 FFmpeg 并添加到 PATH
```

#### 2. DashScope API 错误

**错误**: `API key not configured`

**解决**: 在 Settings 页面配置 DashScope API Key，或在 `.env` 文件中设置。

#### 3. 端口占用

**错误**: `Address already in use`

**解决**: 更改端口或关闭占用端口的进程
```bash
# 查看端口占用
lsof -i :8000

# 更改端口启动
uvicorn server.main:app --port 8001
```

更多问题请查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📝 开发文档

- [功能改进总结](IMPROVEMENTS.md)
- [升级说明](UPGRADE_SUMMARY.md)
- [故障排除](TROUBLESHOOTING.md)
- [部署指南](DEPLOYMENT.md)

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [DouyinLiveRecorder](https://github.com/ihmily/DouyinLiveRecorder) - 直播录制核心功能
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Python Web 框架
- [React](https://reactjs.org/) - 用户界面库
- [阿里云 DashScope](https://dashscope.aliyun.com/) - AI 服务提供商

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/baifan11/AI-Live-Review/issues)
- Email: your-email@example.com

---

**⭐ 如果这个项目对您有帮助，请给个 Star！**
