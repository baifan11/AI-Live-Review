# 系统设计文档：直播录制与 AI 智能复盘平台

## 1. 系统概览
本平台旨在实现对多平台（抖音、TikTok 等）直播内容的自动录制、本地存储，并利用先进的 AI 模型（语音识别、视觉分析、大语言模型）进行多维度的深度复盘分析。

## 2. 架构设计

### 2.1 高层架构
系统采用 **客户端-服务器 (Client-Server)** 架构，并配合解耦的后台工作进程来处理繁重的媒体任务。

```mermaid
graph TD
    subgraph "前端 (用户界面)"
        UI[React 单页应用]
        Player[视频播放器]
        ReportView[分析报告视图]
    end

    subgraph "后端 (FastAPI)"
        API[API 服务器]
        Scheduler[任务调度器]
        DB[(SQLite 数据库)]
    end

    subgraph "核心服务"
        Fetcher[流获取器 (DouyinLiveRecorder)]
        Recorder[FFmpeg 录制器]
        Processor[媒体处理器 (音频/截图)]
    end

    subgraph "AI 云服务"
        DashScope[阿里云百炼 API]
    end

    User --> UI
    UI -->|REST API| API
    API --> DB
    API --> Scheduler
    Scheduler -->|触发| Fetcher
    Fetcher -->|直播流 URL| Recorder
    Recorder -->|保存 MP4| LocalStorage[本地存储]
    Recorder -->|事件| Processor
    Processor -->|音频/图片| DashScope
    DashScope -->|JSON 结果| Processor
    Processor -->|保存结果| DB
```

### 2.2 技术栈
| 组件 | 技术选型 | 选择理由 |
| :--- | :--- | :--- |
| **前端** | React 18, Vite, TailwindCSS, Shadcn/ui | 现代化、高性能、提供极佳的视觉体验。 |
| **后端** | Python 3.10+, FastAPI | 高性能，易于集成 AI 和数据处理库。 |
| **数据库** | SQLite (via SQLModel) | 轻量级，零配置，非常适合本地部署。 |
| **任务队列** | APScheduler | Python 内置的强大调度库，用于周期性录制任务。 |
| **媒体引擎** | FFmpeg | 视频录制和处理的行业标准。 |
| **AI 提供商** | 阿里云百炼 (通义千问) | 业内领先的中文理解和视觉分析能力。 |

## 3. 详细数据流

### 3.1 录制流程
1.  **任务创建**：用户创建任务（输入直播间地址、录制间隔、时长）。
2.  **任务调度**：`APScheduler` 按照设定的间隔触发任务。
3.  **流解析**：`StreamFetcher` 解析直播间 URL，获取真实的流地址 (m3u8/flv)。
4.  **视频录制**：调用 `FFmpeg` 录制指定时长的视频。
5.  **完成处理**：文件保存至 `storage/{task_id}/{timestamp}.mp4`。状态更新为 `recorded`。

### 3.2 AI 分析流程 (录制后)
1.  **触发分析**：录制完成 -> 触发 `AnalysisPipeline`。
2.  **预处理**：
    *   **音频分离**：从 MP4 提取音频 -> `audio.wav`。
    *   **画面切片**：每隔 $N$ 秒提取一帧 -> `frames/*.jpg`。
3.  **AI 处理**：
    *   **语音识别 (ASR)**：发送 `audio.wav` 到 `qwen3-asr-flash` -> 获取带时间戳的逐字稿。
    *   **视觉分析 (Vision)**：发送图片到 `qwen-vl-plus` -> 获取图片内容描述。
    *   **综合分析 (LLM)**：将“逐字稿”+“图片描述”发送到 `qwen3-max` -> 获取最终的 JSON 评估报告。
4.  **结果存储**：将 JSON 结果保存到 `Record` 表中。

## 4. 数据库设计

### `Task` 表 (任务)
| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer | 主键 |
| `url` | String | 直播间链接 |
| `platform` | String | 平台标识 (如 "douyin", "tiktok") |
| `interval` | Integer | 循环录制间隔 (秒) |
| `duration` | Integer | 单次录制时长 (秒) |
| `ai_config` | JSON | 自定义 Prompt 和模型配置 |
| `is_active` | Boolean | 任务激活状态 |

### `Record` 表 (记录)
| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `id` | Integer | 主键 |
| `task_id` | Integer | 外键 (关联 Task) |
| `start_time` | DateTime | 录制开始时间 |
| `status` | String | 状态: `pending`(等待), `recording`(录制中), `processing`(处理中), `done`(完成), `failed`(失败) |
| `video_path` | String | 视频文件路径 |
| `transcript` | JSON | ASR 识别结果 (含时间戳) |
| `analysis` | JSON | 最终 AI 复盘报告 |

## 5. API 接口设计

### 任务管理 (Task Management)
*   `GET /tasks`: 获取所有任务列表。
*   `POST /tasks`: 创建新任务。
*   `PUT /tasks/{id}`: 更新任务 (停止/启动)。
*   `DELETE /tasks/{id}`: 删除任务。

### 记录管理 (Record Management)
*   `GET /tasks/{id}/records`: 获取指定任务的所有录制记录。
*   `GET /records/{id}`: 获取单条记录详情 (视频路径、分析结果)。
*   `GET /records/{id}/stream`: 流式传输视频文件给前端播放。

### 系统配置 (System)
*   `GET /config`: 获取系统配置 (AI Key, 默认 Prompt)。
*   `POST /config`: 更新配置。

## 6. UI/UX 设计 (前端)

### 6.1 仪表盘 (Dashboard)
*   **概览卡片**：总任务数、已用存储空间、AI 额度状态。
*   **活跃任务**：展示当前正在进行的录制任务。

### 6.2 任务管理
*   **创建弹窗**：输入 URL，设置时长/间隔，配置 AI 选项。
*   **任务列表**：表格视图，清晰展示状态。

### 6.3 复盘报告页
*   **布局**：左右分屏设计。
    *   **左侧**：视频播放器。
    *   **右侧**：可滚动的逐字稿 & AI 分析报告。
*   **交互**：点击逐字稿中的时间戳，视频自动跳转到对应时间。
*   **可视化**：展示“情绪曲线”、“互动指数”等图表。

## 7. 安全与性能
*   **本地优先**：所有视频文件存储在用户本地，数据自主可控。
*   **密钥安全**：API Key 安全存储在本地数据库/环境变量中。
*   **并发控制**：限制同时录制的任务数量，防止网络/CPU 过载。
