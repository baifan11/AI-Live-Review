import os
import sys
import importlib.util

# 动态导入utils模块以避免循环依赖
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from src.utils import read_config_value

CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'config.ini')

class ConfigManager:
    @staticmethod
    def get_cookie(key: str) -> str:
        return read_config_value(CONFIG_FILE, 'Cookie', key)

    @staticmethod
    def get_proxy() -> str:
        # Implement proxy reading logic if needed, or return None
        # Based on original main.py, it reads 'proxy_addr' from 'Global' or similar
        # Let's check config.ini structure later. For now, return None or read specific key.
        return read_config_value(CONFIG_FILE, 'Global', 'proxy_addr')
    
    @staticmethod
    def get_value(section: str, key: str) -> str:
        return read_config_value(CONFIG_FILE, section, key)
