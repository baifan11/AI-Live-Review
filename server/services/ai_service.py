import os
import logging
import json
from http import HTTPStatus
import dashscope
from dashscope.audio.asr import Transcription, Recognition

logger = logging.getLogger(__name__)

# Ensure API Key is set
# In production, this should be loaded from config or env var
# For now, we assume it's in the environment or config.ini
# dashscope.api_key = "YOUR_API_KEY" 

class AIService:
    
    @staticmethod
    def set_api_key(api_key: str):
        dashscope.api_key = api_key

    @staticmethod
    async def verify_api_key(api_key: str) -> bool:
        """
        Verify if the given API Key is valid by making a simple request.
        """
        dashscope.api_key = api_key
        try:
            # Simple call to list models or similar lightweight call
            # Using Qwen-turbo for a quick test generation
            response = dashscope.Generation.call(
                model='qwen-turbo',
                messages=[{'role': 'user', 'content': 'hi'}],
                result_format='message'
            )
            return response.status_code == HTTPStatus.OK
        except Exception as e:
            logger.error(f"API Key verification failed: {e}")
            return False

    @staticmethod
    async def transcribe_audio(audio_path: str) -> str:
        """
        Transcribe audio using DashScope Recognition (paraformer-realtime-v1).
        This supports local files directly.
        """
        logger.info(f"Transcribing audio: {audio_path}")
        
        if not os.path.exists(audio_path):
            raise Exception(f"Audio file not found: {audio_path}")

        # Ensure API Key is set from env if not already
        if not dashscope.api_key:
            dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

        recognition = Recognition(
            model='paraformer-realtime-v1',
            format='wav',
            sample_rate=16000,
            callback=None,
            language_hints=['zh', 'en']
        )
        
        try:
            # Run synchronous call in thread pool
            import asyncio
            response = await asyncio.to_thread(recognition.call, audio_path)
            
            if response.status_code == HTTPStatus.OK:
                # The output format for Recognition is different from Transcription
                # It usually contains 'sentences' in the output
                sentences = response.output.get('sentence', [])
                # If it's a single result object, it might be structured differently
                # Let's try to extract text
                if not sentences and 'text' in response.output:
                     return json.dumps([{"text": response.output['text']}], ensure_ascii=False)
                
                return json.dumps(sentences, ensure_ascii=False)
            else:
                raise Exception(f"Transcription failed: {response.message}")
        except Exception as e:
            logger.error(f"Transcription exception: {e}")
            raise e

    @staticmethod
    async def analyze_images(image_paths: list[str], prompt: str = "Describe this image") -> list[str]:
        """
        Analyze images using Qwen-VL-Plus.
        """
        results = []
        import asyncio
        
        for img_path in image_paths:
            try:
                def _call_vl():
                    return dashscope.MultiModalConversation.call(
                        model='qwen-vl-plus',
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"image": f"file://{img_path}"},
                                    {"text": prompt}
                                ]
                            }
                        ]
                    )
                
                # Run synchronous call in thread pool
                response = await asyncio.to_thread(_call_vl)
                
                if response.status_code == HTTPStatus.OK:
                    content = response.output.choices[0].message.content
                    results.append(f"Frame {os.path.basename(img_path)}: {content}")
                else:
                    logger.error(f"Image analysis failed for {img_path}: {response.message}")
                    results.append(f"Frame {os.path.basename(img_path)}: Error")
            except Exception as e:
                logger.error(f"Image analysis exception for {img_path}: {e}")
        
        return results

    @staticmethod
    async def generate_report(transcript: str, visual_analysis: list[str], prompt: str) -> str:
        """
        Generate comprehensive report using Qwen-Max.
        """
        visual_text = "\n".join(visual_analysis)
        full_prompt = f"""
        {prompt}

        [Transcript Data]
        {transcript}

        [Visual Analysis Data]
        {visual_text}

        请使用中文撰写分析报告，确保所有内容都是中文。
        """

        import asyncio
        def _call_generation():
            return dashscope.Generation.call(
                model='qwen-max',
                messages=[
                    {'role': 'system', 'content': 'You are a professional live stream analyst. 请确保所有分析和报告均使用中文输出。'},
                    {'role': 'user', 'content': full_prompt}
                ],
                result_format='message'
            )

        # Run synchronous call in thread pool
        response = await asyncio.to_thread(_call_generation)
        
        if response.status_code == HTTPStatus.OK:
            return response.output.choices[0].message.content
        else:
            raise Exception(f"Report generation failed: {response.message}")
