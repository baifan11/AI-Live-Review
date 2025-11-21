# 测试配置说明

## 问题诊断

你遇到的"打开 Chrome 等待反馈时对话停止"的问题，主要原因是：

### 1. **录制任务阻塞**
- FFmpeg 录制是一个长时间运行的进程
- 如果录制时长设置过长（比如 60 秒或更长），会导致整个异步任务阻塞
- 这会让 API 请求超时，对话中断

### 2. **已实施的解决方案**

我已经对代码进行了以下改进：

#### A. 添加超时控制 (`recorder.py`)
```python
# 添加了超时机制：录制时长 + 30秒缓冲
timeout = duration + 30
stdout, stderr = await asyncio.wait_for(
    process.communicate(),
    timeout=timeout
)
```

#### B. 增强日志记录 (`scheduler.py`)
```python
# 添加了详细的步骤日志
logger.info(f"[Task {task_id}] Step 1/5: Fetching stream URL")
logger.info(f"[Task {task_id}] Step 2/5: Starting recording")
# ... 等等
```

### 3. **建议的测试步骤**

#### 步骤 1: 使用短时长测试
创建任务时，先使用较短的录制时长（比如 10-30 秒）：

```json
{
  "name": "测试任务",
  "url": "https://live.douyin.com/xxxxx",
  "duration": 10,  // 先用 10 秒测试
  "interval": 300,
  "ai_enabled": false,  // 先关闭 AI
  "audio_only": false,
  "is_active": true
}
```

#### 步骤 2: 查看日志
启动服务后，观察终端日志输出：
- 应该能看到 `[Task X] Step 1/5: Fetching stream URL`
- 应该能看到 `[Task X] Step 2/5: Starting recording (duration: 10s)`
- 应该能看到 `Recording with timeout: 40s`
- 最后应该看到 `Task X completed successfully`

#### 步骤 3: 检查数据库
查看 `database.db` 中的 `records` 表：
```sql
SELECT id, task_id, status, video_path, created_at 
FROM records 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4. **常见问题排查**

#### 问题 A: 任务一直卡在 "recording" 状态
**原因**: 
- 直播流可能不可用
- FFmpeg 无法连接到流媒体 URL
- 网络问题

**解决方法**:
1. 检查日志中的错误信息
2. 手动测试直播 URL 是否可访问
3. 使用 `demo.py` 测试获取流地址：
```bash
cd /Users/baifan/Desktop/develop/AI-review
source server/venv/bin/activate
python demo.py
```

#### 问题 B: FFmpeg 超时
**原因**: 
- 录制时长设置过长
- 网络不稳定导致下载缓慢

**解决方法**:
1. 减少 `duration` 值
2. 检查网络连接
3. 查看 FFmpeg 错误日志

#### 问题 C: 对话仍然中断
**原因**: 
- 可能是前端请求超时
- 或者是调度器配置问题

**解决方法**:
1. 确保任务是异步执行的（已在代码中实现）
2. 检查前端是否有请求超时设置
3. 考虑将录制改为完全后台任务

### 5. **进一步优化建议**

如果问题仍然存在，可以考虑：

#### 选项 1: 使用 Celery 或 RQ 作为任务队列
将录制任务完全放到独立的工作进程中执行

#### 选项 2: 使用 WebSocket 推送进度
让前端通过 WebSocket 接收任务进度更新，而不是等待 HTTP 响应

#### 选项 3: 分离录制和 AI 分析
- 先快速完成录制
- 将 AI 分析作为独立的后台任务

### 6. **测试命令**

```bash
# 1. 重启后端服务
# 在终端中按 Ctrl+C 停止当前服务，然后重新启动

# 2. 查看日志
tail -f logs/app.log  # 如果有日志文件

# 3. 测试创建任务（使用 curl 或前端界面）
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试任务",
    "url": "https://live.douyin.com/745964462470",
    "duration": 10,
    "interval": 300,
    "ai_enabled": false,
    "audio_only": false,
    "is_active": true
  }'
```

### 7. **监控要点**

在测试过程中，重点关注：
1. ✅ 任务是否成功创建
2. ✅ 调度器是否触发任务
3. ✅ FFmpeg 是否成功启动
4. ✅ 录制是否在预期时间内完成
5. ✅ 文件是否成功保存到 storage 目录
6. ✅ 数据库记录状态是否正确更新

---

## 下一步

1. **重启服务**: 让新代码生效
2. **创建测试任务**: 使用 10 秒的短时长
3. **观察日志**: 查看详细的执行步骤
4. **反馈结果**: 告诉我具体在哪一步卡住了

如果还有问题，请提供：
- 具体的错误日志
- 任务配置（duration, url 等）
- 卡住时的状态（在哪个步骤）
