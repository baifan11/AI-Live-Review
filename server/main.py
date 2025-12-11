from fastapi import FastAPI, Depends, HTTPException
from typing import Optional
from contextlib import asynccontextmanager
from sqlmodel import Session, select
from database import create_db_and_tables, get_session, Task, TaskBase, Record, Settings, engine
from scheduler import start_scheduler, add_task_job, remove_task_job

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    start_scheduler()
    # Restore active tasks on startup
    with Session(engine) as session:
        tasks = session.exec(select(Task).where(Task.is_active == True)).all()
        for task in tasks:
            add_task_job(task)
    yield

app = FastAPI(lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "*"],  # Allow frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage for local development
# In Docker, Nginx handles this. But for local dev, we need FastAPI to serve it.
if os.path.exists("storage"):
    app.mount("/storage", StaticFiles(directory="storage"), name="storage")
elif os.path.exists("../storage"):
    app.mount("/storage", StaticFiles(directory="../storage"), name="storage")

@app.post("/tasks/", response_model=Task)
def create_task(task: TaskBase, session: Session = Depends(get_session)):
    db_task = Task.model_validate(task)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    
    if db_task.is_active:
        add_task_job(db_task)
        
    return db_task

@app.get("/tasks/", response_model=list[Task])
def read_tasks(session: Session = Depends(get_session)):
    tasks = session.exec(select(Task)).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=Task)
def read_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskBase, session: Session = Depends(get_session)):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_data = task_update.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(db_task, key, value)
        
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    
    # Update scheduler
    if db_task.is_active:
        add_task_job(db_task)
    else:
        remove_task_job(task_id)
        
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    remove_task_job(task_id)
    session.delete(task)
    session.commit()
    return {"ok": True}

@app.post("/tasks/{task_id}/trigger")
async def trigger_task(task_id: int, session: Session = Depends(get_session)):
    """手动触发任务执行（用于测试）"""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Import here to avoid circular dependency
    from scheduler import recording_job
    import asyncio
    
    # Run the recording job in background
    asyncio.create_task(recording_job(task_id))
    
    return {"ok": True, "message": f"Task {task_id} triggered"}

@app.post("/tasks/{task_id}/pause")
def pause_task(task_id: int, session: Session = Depends(get_session)):
    """暂停任务"""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # 将任务设为非活跃状态
    task.is_active = False
    session.add(task)
    session.commit()
    
    # 移除调度任务
    remove_task_job(task_id)
    
    return {"ok": True, "message": f"Task {task_id} paused"}

@app.post("/tasks/{task_id}/resume")
def resume_task(task_id: int, session: Session = Depends(get_session)):
    """恢复任务"""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # 将任务设为活跃状态
    task.is_active = True
    session.add(task)
    session.commit()
    
    # 重新添加调度任务
    add_task_job(task)
    
    return {"ok": True, "message": f"Task {task_id} resumed"}

@app.post("/tasks/{task_id}/stop")
def stop_task(task_id: int, session: Session = Depends(get_session)):
    """停止任务（暂停的别名，保持一致性）"""
    return pause_task(task_id, session)

@app.get("/records/", response_model=list[Record])
def read_records(task_id: Optional[int] = None, sort: str = "desc", session: Session = Depends(get_session)):
    query = select(Record)
    if task_id:
        query = query.where(Record.task_id == task_id)
    
    if sort == "asc":
        query = query.order_by(Record.start_time.asc())
    else:
        query = query.order_by(Record.start_time.desc())
        
    records = session.exec(query).all()
    return records

@app.get("/records/{record_id}", response_model=Record)
def read_record(record_id: int, session: Session = Depends(get_session)):
    record = session.get(Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@app.delete("/records/{record_id}")
def delete_record(record_id: int, session: Session = Depends(get_session)):
    record = session.get(Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    session.delete(record)
    session.commit()
    return {"ok": True}

# Settings API
from database import Settings
from services.prompt_manager import PromptManager

# Initialize default prompts on startup
@app.on_event("startup")
async def startup_event():
    PromptManager.initialize_default_prompts()

@app.get("/settings/{key}", response_model=Settings)
def read_setting(key: str, session: Session = Depends(get_session)):
    setting = session.get(Settings, key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@app.get("/settings-batch/")
def read_settings_batch(keys: str, session: Session = Depends(get_session)):
    """批量获取多个设置项，keys用逗号分隔"""
    key_list = keys.split(',')
    settings = {}
    for key in key_list:
        setting = session.get(Settings, key.strip())
        settings[key.strip()] = setting.value if setting else None
    return settings

@app.put("/settings/", response_model=Settings)
def update_setting(setting: Settings, session: Session = Depends(get_session)):
    db_setting = session.get(Settings, setting.key)
    if db_setting:
        db_setting.value = setting.value
        session.add(db_setting)
    else:
        session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting

@app.post("/settings-batch/")
def update_settings_batch(settings: dict, session: Session = Depends(get_session)):
    """批量更新多个设置项"""
    updated = []
    for key, value in settings.items():
        db_setting = session.get(Settings, key)
        if db_setting:
            db_setting.value = value
            session.add(db_setting)
        else:
            new_setting = Settings(key=key, value=value)
            session.add(new_setting)
        updated.append(key)
    session.commit()
    return {"updated": updated, "count": len(updated)}
from typing import Optional
from pydantic import BaseModel
from services.ai_service import AIService

class APIKeyRequest(BaseModel):
    api_key: str

@app.get("/settings/apikey")
def get_api_key(session: Session = Depends(get_session)):
    """Get masked API Key"""
    setting = session.get(Settings, "DASHSCOPE_API_KEY")
    task_setting = session.get(Settings, "dashscope_api_key") # Check legacy or lowercase
    
    val = None
    if setting: val = setting.value
    elif task_setting: val = task_setting.value
    
    if not val:
        return {"api_key": ""}
    
    if len(val) > 8:
        masked = val[:4] + "****" + val[-4:]
    else:
        masked = "****"
        
    return {"api_key": masked}

@app.put("/settings/apikey")
async def save_api_key(request: APIKeyRequest, session: Session = Depends(get_session)):
    """Verify and save API Key"""
    is_valid = await AIService.verify_api_key(request.api_key)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid API Key")
        
    # Save to database
    db_setting = session.get(Settings, "DASHSCOPE_API_KEY")
    if db_setting:
        db_setting.value = request.api_key
        session.add(db_setting)
    else:
        new_setting = Settings(key="DASHSCOPE_API_KEY", value=request.api_key)
        session.add(new_setting)
        
    session.commit()
    return {"ok": True, "message": "API Key saved"}




