from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, create_engine, Session, Relationship

class TaskBase(SQLModel):
    url: str
    platform: str = "unknown"
    anchor_id: str = "unknown"  # 主播ID
    anchor_name: str = "unknown"
    interval: int = 300  # Seconds between recordings
    duration: int = 60   # Duration of each recording in seconds
    loop_count: int = 1  # Number of times to loop
    max_recordings: int = 0  # 最大录制段数，0表示无限制
    audio_only: bool = False
    
    # AI Configuration
    ai_enabled: bool = True
    prompt_transcript: Optional[str] = None
    prompt_vision: Optional[str] = None
    prompt_summary: Optional[str] = None
    
    # Status
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    records: List["Record"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class RecordBase(SQLModel):
    task_id: int = Field(foreign_key="task.id")
    anchor_id: str = "unknown"  # 主播ID，冗余存储便于查询
    anchor_name: str = "unknown"  # 主播名称，冗余存储便于显示
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    
    # File Paths
    video_path: Optional[str] = None
    audio_path: Optional[str] = None
    cover_path: Optional[str] = None
    
    # Status
    status: str = "pending" # pending, recording, processing, analyzed, failed
    
    # Analysis Results (JSON stored as string)
    transcript_path: Optional[str] = None
    analysis_result: Optional[str] = None # JSON string

class Record(RecordBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task: Optional[Task] = Relationship(back_populates="records")

class Settings(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str

# Database Setup
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
