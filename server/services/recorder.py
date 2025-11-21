import asyncio
import logging
import os
import subprocess

logger = logging.getLogger(__name__)

class RecorderService:
    @staticmethod
    async def record_stream(stream_url: str, output_path: str, duration: int, audio_only: bool = False) -> str:
        """
        Record stream using FFmpeg with timeout control.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", stream_url,
            "-t", str(duration),
        ]
        
        if audio_only:
            # Save as WAV
            cmd.extend(["-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1"])
        else:
            # Save as MP4 (Copy stream)
            # Note: Some streams (like FLV) might need aac_adtstoasc filter when putting into MP4
            cmd.extend(["-c", "copy", "-bsf:a", "aac_adtstoasc", "-movflags", "+faststart"])
            
        cmd.append(output_path)
        
        logger.info(f"Executing FFmpeg: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            # 添加超时控制：录制时长 + 30秒缓冲时间
            timeout = duration + 30
            logger.info(f"Recording with timeout: {timeout}s")
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            if process.returncode != 0:
                error_msg = stderr.decode()
                logger.error(f"FFmpeg Error: {error_msg}")
                raise Exception(f"FFmpeg failed: {error_msg}")
            
            logger.info(f"Recording completed successfully: {output_path}")
            
        except asyncio.TimeoutError:
            logger.error(f"Recording timeout after {timeout}s, terminating FFmpeg")
            process.kill()
            await process.wait()
            raise Exception(f"Recording timeout after {timeout}s")
            
        except asyncio.CancelledError:
            logger.warning("Recording cancelled, terminating FFmpeg")
            process.terminate()
            await process.wait()
            raise
            
        return output_path
