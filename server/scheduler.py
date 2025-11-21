from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session, select
from database import engine, Task, Record
from services.stream_fetcher import StreamFetcher
from services.recorder import RecorderService
from services.ai_service import AIService
from services.media_processor import MediaProcessor
from services.prompt_manager import PromptManager
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def recording_job(task_id: int):
    """
    录制任务主函数 - 作为后台任务运行
    """
    logger.info(f"========== Starting recording job for task {task_id} ==========")
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task or not task.is_active:
            logger.info(f"Task {task_id} is inactive or deleted.")
            return

        # Create Record
        record = Record(task_id=task.id, anchor_id=task.anchor_id, anchor_name=task.anchor_name, status="recording")
        session.add(record)
        session.commit()
        session.refresh(record)
        
        logger.info(f"Created record {record.id} for task {task_id}")
        
        try:
            # 0. Load API Key from .env if AI enabled
            if task.ai_enabled:
                logger.info(f"AI enabled for task {task_id}, loading API key")
                from dotenv import load_dotenv
                load_dotenv()
                api_key = os.getenv('DASHSCOPE_API_KEY')
                if api_key:
                    AIService.set_api_key(api_key)
                    logger.info("API key loaded successfully")
                else:
                    logger.warning("AI enabled but DASHSCOPE_API_KEY not found in .env")
            
            
            # 1. Get Stream URL
            logger.info(f"[Task {task_id}] Step 1/5: Fetching stream URL for {task.url}")
            stream_info = await StreamFetcher.get_stream_url(task.url)
            
            if not stream_info.get('is_live'):
                 logger.info(f"Stream {task.url} is not live.")
                 record.status = "failed"
                 record.analysis_result = "Stream is not live"
                 session.add(record)
                 session.commit()
                 return

            real_url = stream_info.get('record_url')
            if not real_url:
                raise Exception("No stream URL found")
            
            logger.info(f"[Task {task_id}] Stream URL obtained: {real_url[:50]}...")
                
            # 2. Record
            logger.info(f"[Task {task_id}] Step 2/5: Starting recording (duration: {task.duration}s)")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}.mp4"
            # storage/task_id/filename
            save_dir = os.path.join("storage", str(task.id))
            save_path = os.path.join(save_dir, filename)
            
            logger.info(f"Recording to {save_path}")
            await RecorderService.record_stream(real_url, save_path, task.duration, task.audio_only)
            
            logger.info(f"[Task {task_id}] Recording completed successfully")
            record.video_path = save_path
            record.end_time = datetime.now()
            record.status = "processing"
            session.add(record)
            session.commit()
            
            # 3. AI Processing
            if task.ai_enabled:
                logger.info(f"[Task {task_id}] Step 3/5: Starting AI processing")
                
                # Extract Audio
                logger.info(f"[Task {task_id}] Extracting audio...")
                audio_path = os.path.join(save_dir, f"{timestamp}.wav")
                await MediaProcessor.extract_audio(save_path, audio_path)
                record.audio_path = audio_path
                
                # Extract Frames
                logger.info(f"[Task {task_id}] Extracting frames...")
                frames_dir = os.path.join(save_dir, "frames")
                frames = await MediaProcessor.extract_frames(save_path, frames_dir, interval=30) # Every 10s
                # Use first frame as cover
                if frames:
                    record.cover_path = frames[0]
                    logger.info(f"[Task {task_id}] Extracted {len(frames)} frames")
                
                # Transcribe
                logger.info(f"[Task {task_id}] Step 4/5: Transcribing audio...")
                transcript = await AIService.transcribe_audio(audio_path)
                # Let's save transcript to file
                transcript_file = os.path.join(save_dir, f"{timestamp}_transcript.json")
                with open(transcript_file, "w", encoding="utf-8") as f:
                    f.write(transcript)
                record.transcript_path = transcript_file
                logger.info(f"[Task {task_id}] Transcription completed")
                
                # Analyze Images
                logger.info(f"[Task {task_id}] Step 5/5: Analyzing images...")
                # Limit frames to avoid token limit (e.g., max 10 frames)
                selected_frames = frames[:10]
                # 使用任务配置的prompt，如果没有则使用系统默认
                vision_prompt = task.prompt_vision or PromptManager.get_prompt('prompt_vision')
                visual_analysis = await AIService.analyze_images(selected_frames, vision_prompt)

                # Generate Report
                logger.info(f"[Task {task_id}] Generating final report...")
                summary_prompt = task.prompt_summary or PromptManager.get_prompt('prompt_summary')
                report = await AIService.generate_report(
                    transcript,
                    visual_analysis,
                    summary_prompt
                )
                record.analysis_result = report
                record.status = "analyzed"
                logger.info(f"[Task {task_id}] AI analysis completed")
            else:
                record.status = "recorded"
                
            session.add(record)
            session.commit()
            logger.info(f"========== Task {task_id} completed successfully ==========")
            
            # 检查是否达到最大录制段数
            if task.max_recordings > 0:
                # 统计该任务已完成的录制数量
                completed_count = session.exec(
                    select(Record).where(
                        Record.task_id == task_id,
                        Record.status.in_(['recorded', 'analyzed'])
                    )
                ).all()
                
                if len(completed_count) >= task.max_recordings:
                    logger.info(f"[Task {task_id}] Reached max recordings limit ({task.max_recordings}), stopping task...")
                    task.is_active = False
                    session.add(task)
                    session.commit()

                    # 移除调度任务
                    remove_task_job(task_id)
                    logger.info(f"[Task {task_id}] Task stopped automatically")
            
        except Exception as e:
            logger.error(f"========== Task {task_id} failed: {e} ==========", exc_info=True)
            record.status = "failed"
            record.analysis_result = str(e)
            session.add(record)
            session.commit()

def start_scheduler():
    scheduler.start()
    logger.info("Scheduler started")

def add_task_job(task: Task):
    scheduler.add_job(
        recording_job,
        IntervalTrigger(seconds=task.interval),
        id=str(task.id),
        args=[task.id],
        replace_existing=True
    )
    logger.info(f"Added job for task {task.id}")

def remove_task_job(task_id: int):
    if scheduler.get_job(str(task_id)):
        scheduler.remove_job(str(task_id))
        logger.info(f"Removed job for task {task_id}")
