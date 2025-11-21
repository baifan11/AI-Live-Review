import asyncio
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from src import spider, stream
from services.config_manager import ConfigManager

logger = logging.getLogger(__name__)

class StreamFetcher:
    @staticmethod
    async def get_stream_url(url: str, timeout: int = 30) -> dict:
        """
        Resolve the real stream URL from the live room URL.
        Returns a dict with keys: 'record_url', 'anchor_name', 'is_live', etc.
        
        Args:
            url: Live room URL
            timeout: Timeout in seconds (default: 30)
        """
        proxy = ConfigManager.get_proxy()
        
        try:
            # 使用 asyncio.wait_for 添加超时控制
            logger.info(f"Fetching stream URL with timeout: {timeout}s")
            
            # Douyin
            if "douyin.com" in url:
                cookies = ConfigManager.get_cookie('dy_cookie')
                if 'v.douyin.com' not in url and '/user/' not in url:
                    json_data = await asyncio.wait_for(
                        spider.get_douyin_web_stream_data(url, proxy_addr=proxy, cookies=cookies),
                        timeout=timeout
                    )
                else:
                    json_data = await asyncio.wait_for(
                        spider.get_douyin_app_stream_data(url, proxy_addr=proxy, cookies=cookies),
                        timeout=timeout
                    )
                
                # Get the stream URL (m3u8/flv)
                # We default to '原画' (Original Quality) which maps to 'OD'
                return await asyncio.wait_for(
                    stream.get_douyin_stream_url(json_data, "OD", proxy),
                    timeout=10
                )

            # TikTok
            elif "tiktok.com" in url:
                cookies = ConfigManager.get_cookie('tiktok_cookie')
                json_data = await asyncio.wait_for(
                    spider.get_tiktok_stream_data(url, proxy_addr=proxy, cookies=cookies),
                    timeout=timeout
                )
                return await asyncio.wait_for(
                    stream.get_tiktok_stream_url(json_data, "OD", proxy),
                    timeout=10
                )

            # Kuaishou
            elif "kuaishou.com" in url:
                cookies = ConfigManager.get_cookie('ks_cookie')
                json_data = await asyncio.wait_for(
                    spider.get_kuaishou_stream_data(url, proxy_addr=proxy, cookies=cookies),
                    timeout=timeout
                )
                return await asyncio.wait_for(
                    stream.get_kuaishou_stream_url(json_data, "OD"),
                    timeout=10
                )

            # Huya
            elif "huya.com" in url:
                cookies = ConfigManager.get_cookie('hy_cookie')
                # Try web first
                json_data = await asyncio.wait_for(
                    spider.get_huya_stream_data(url, proxy_addr=proxy, cookies=cookies),
                    timeout=timeout
                )
                return await asyncio.wait_for(
                    stream.get_huya_stream_url(json_data, "OD"),
                    timeout=10
                )

            # Douyu
            elif "douyu.com" in url:
                cookies = ConfigManager.get_cookie('douyu_cookie')
                json_data = await asyncio.wait_for(
                    spider.get_douyu_info_data(url, proxy_addr=proxy, cookies=cookies),
                    timeout=timeout
                )
                return await asyncio.wait_for(
                    stream.get_douyu_stream_url(json_data, video_quality="OD", cookies=cookies, proxy_addr=proxy),
                    timeout=10
                )

            # Bilibili
            elif "bilibili.com" in url:
                cookies = ConfigManager.get_cookie('bili_cookie')
                json_data = await asyncio.wait_for(
                    spider.get_bilibili_room_info(url, proxy_addr=proxy, cookies=cookies),
                    timeout=timeout
                )
                return await asyncio.wait_for(
                    stream.get_bilibili_stream_url(json_data, video_quality="OD", cookies=cookies, proxy_addr=proxy),
                    timeout=10
                )

            else:
                raise ValueError(f"Unsupported platform for URL: {url}")
                
        except asyncio.TimeoutError:
            logger.error(f"Timeout while fetching stream URL for: {url}")
            raise Exception(f"Failed to fetch stream URL: timeout after {timeout}s")
