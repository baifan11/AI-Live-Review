import asyncio
import logging
import os
import math

logger = logging.getLogger(__name__)

class MediaProcessor:
    @staticmethod
    async def extract_audio(video_path: str, output_path: str) -> str:
        """
        Extract audio from video file.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_path
        ]
        
        logger.info(f"Extracting audio: {' '.join(cmd)}")
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"Audio extraction failed: {stderr.decode()}")
            
        return output_path

    @staticmethod
    async def extract_frames(video_path: str, output_dir: str, interval: int = 60) -> list[str]:
        """
        Extract frames from video at specified intervals.
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Get video duration first (optional, but good for logging)
        # For now, we just use ffmpeg fps filter
        # fps=1/60 means 1 frame every 60 seconds
        
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"fps=1/{interval}",
            "-q:v", "2",
            "-strict", "unofficial",
            f"{output_dir}/frame_%04d.jpg"
        ]
        
        logger.info(f"Extracting frames: {' '.join(cmd)}")
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"Frame extraction failed: {stderr.decode()}")
            
        # Return list of generated files
        frames = sorted([
            os.path.join(output_dir, f) 
            for f in os.listdir(output_dir) 
            if f.endswith('.jpg')
        ])
        return frames
