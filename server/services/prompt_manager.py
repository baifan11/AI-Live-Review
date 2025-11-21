from sqlmodel import Session
from database import engine, Settings
import logging

logger = logging.getLogger(__name__)

class PromptManager:
    """管理系统默认的AI提示词"""

    # 系统默认提示词
    DEFAULT_PROMPTS = {
        'prompt_transcript': """请分析这段直播内容，关注以下方面：
1. 主播的主要话术和表达特点
2. 商品介绍的关键信息
3. 观众互动和反馈情况
4. 销售话术和转化技巧""",

        'prompt_vision': """请详细描述这张直播截图中的内容，包括：主播的状态、商品展示、背景环境、文字信息、观众互动等关键要素""",

        'prompt_summary': """请综合分析这段直播内容和相关画面，提供以下维度的评估：

1. **直播主题和主要内容**
2. **主播表现评估**（话术、互动、专业性）
3. **观众反馈分析**
4. **转化效果评估**
5. **关键亮点总结**
6. **优化建议**

请确保所有分析和报告均使用中文输出。"""
    }

    @staticmethod
    def get_default_prompt(key: str) -> str:
        """获取指定key的默认提示词"""
        return PromptManager.DEFAULT_PROMPTS.get(key, "")

    @staticmethod
    def load_system_prompts() -> dict:
        """从数据库加载系统提示词配置，如果不存在则使用默认值"""
        prompts = {}
        with Session(engine) as session:
            for key in PromptManager.DEFAULT_PROMPTS.keys():
                setting = session.get(Settings, key)
                if setting and setting.value:
                    prompts[key] = setting.value
                    logger.info(f"Loaded system prompt for {key} from database")
                else:
                    prompts[key] = PromptManager.DEFAULT_PROMPTS[key]
                    logger.info(f"Using default prompt for {key}")
        return prompts

    @staticmethod
    def get_prompt(key: str) -> str:
        """获取单个提示词（优先从数据库，其次用默认值）"""
        with Session(engine) as session:
            setting = session.get(Settings, key)
            if setting and setting.value:
                return setting.value
        return PromptManager.DEFAULT_PROMPTS.get(key, "")

    @staticmethod
    def initialize_default_prompts():
        """初始化数据库中的默认提示词（仅在不存在时创建）"""
        with Session(engine) as session:
            created = []
            for key, value in PromptManager.DEFAULT_PROMPTS.items():
                existing = session.get(Settings, key)
                if not existing:
                    setting = Settings(key=key, value=value)
                    session.add(setting)
                    created.append(key)
                    logger.info(f"Created default prompt for {key}")

            if created:
                session.commit()
                logger.info(f"Initialized {len(created)} default prompts: {', '.join(created)}")
            else:
                logger.info("All default prompts already exist in database")
