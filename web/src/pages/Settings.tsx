import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateSetting, getSettingsBatch, updateSettingsBatch } from '../lib/api';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
    const queryClient = useQueryClient();
    const [apiKey, setApiKey] = useState('');
    const [prompts, setPrompts] = useState({
        prompt_transcript: '',
        prompt_vision: '',
        prompt_summary: ''
    });
    const [message, setMessage] = useState('');

    // 默认提示词
    const defaultPrompts = {
        prompt_transcript: '请分析这段直播内容，关注以下方面：\n1. 主播的主要话术和表达特点\n2. 商品介绍的关键信息\n3. 观众互动和反馈情况\n4. 销售话术和转化技巧',
        prompt_vision: '请详细描述这张直播截图中的内容，包括：主播的状态、商品展示、背景环境、文字信息、观众互动等关键要素',
        prompt_summary: '请综合分析这段直播内容和相关画面，提供以下维度的评估：\n\n1. **直播主题和主要内容**\n2. **主播表现评估**（话术、互动、专业性）\n3. **观众反馈分析**\n4. **转化效果评估**\n5. **关键亮点总结**\n6. **优化建议**\n\n请确保所有分析和报告均使用中文输出。'
    };

    // 批量获取所有设置
    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: () => getSettingsBatch([
            'dashscope_api_key',
            'prompt_transcript',
            'prompt_vision',
            'prompt_summary'
        ]),
        retry: false
    });

    useEffect(() => {
        if (settings) {
            setApiKey(settings.dashscope_api_key || '');
            setPrompts({
                prompt_transcript: settings.prompt_transcript || defaultPrompts.prompt_transcript,
                prompt_vision: settings.prompt_vision || defaultPrompts.prompt_vision,
                prompt_summary: settings.prompt_summary || defaultPrompts.prompt_summary
            });
        }
    }, [settings]);

    const apiKeyMutation = useMutation({
        mutationFn: (value: string) => updateSetting('dashscope_api_key', value),
        onSuccess: () => {
            showMessage('API Key 保存成功！');
        },
        onError: () => {
            showMessage('保存失败，请重试。', 'error');
        }
    });

    const promptsMutation = useMutation({
        mutationFn: (values: typeof prompts) => updateSettingsBatch(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            showMessage('提示词配置保存成功！');
        },
        onError: () => {
            showMessage('保存失败，请重试。', 'error');
        }
    });

    const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
        setMessage(type === 'success' ? `✅ ${msg}` : `❌ ${msg}`);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleApiKeySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        apiKeyMutation.mutate(apiKey);
    };

    const handlePromptsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        promptsMutation.mutate(prompts);
    };

    const resetToDefault = () => {
        setPrompts(defaultPrompts);
        showMessage('已恢复默认提示词');
    };

    if (isLoading) return <div className="p-8">加载中...</div>;

    return (
        <div className="p-8 space-y-8 max-w-4xl">
            <h1 className="text-3xl font-bold">系统设置</h1>

            {/* API Key 配置 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">AI 配置</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        配置阿里云 DashScope API Key 以启用 AI 分析功能（语音识别、视觉分析、大语言模型）。
                    </p>
                </div>

                <form onSubmit={handleApiKeySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">DashScope API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full p-2 border rounded-md font-mono text-sm"
                            placeholder="sk-..."
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={apiKeyMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            <Save size={16} />
                            {apiKeyMutation.isPending ? '保存中...' : '保存 API Key'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Prompt 配置 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">AI 提示词配置</h2>
                        <p className="text-sm text-gray-500">
                            自定义 AI 分析的提示词，控制转录、视觉分析和总结报告的内容风格。
                        </p>
                    </div>
                    <button
                        onClick={resetToDefault}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        恢复默认
                    </button>
                </div>

                <form onSubmit={handlePromptsSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            转录分析提示词 (prompt_transcript)
                            <span className="ml-2 text-xs text-gray-400">用于分析音频转录内容</span>
                        </label>
                        <textarea
                            value={prompts.prompt_transcript}
                            onChange={(e) => setPrompts({ ...prompts, prompt_transcript: e.target.value })}
                            rows={4}
                            className="w-full p-3 border rounded-md text-sm font-mono resize-y"
                            placeholder={defaultPrompts.prompt_transcript}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            视觉分析提示词 (prompt_vision)
                            <span className="ml-2 text-xs text-gray-400">用于分析视频截图</span>
                        </label>
                        <textarea
                            value={prompts.prompt_vision}
                            onChange={(e) => setPrompts({ ...prompts, prompt_vision: e.target.value })}
                            rows={3}
                            className="w-full p-3 border rounded-md text-sm font-mono resize-y"
                            placeholder={defaultPrompts.prompt_vision}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            总结报告提示词 (prompt_summary)
                            <span className="ml-2 text-xs text-gray-400">用于生成综合分析报告</span>
                        </label>
                        <textarea
                            value={prompts.prompt_summary}
                            onChange={(e) => setPrompts({ ...prompts, prompt_summary: e.target.value })}
                            rows={8}
                            className="w-full p-3 border rounded-md text-sm font-mono resize-y"
                            placeholder={defaultPrompts.prompt_summary}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className={`text-sm ${message.includes('❌') ? 'text-red-600' : 'text-green-600'} font-medium`}>
                            {message}
                        </div>
                        <button
                            type="submit"
                            disabled={promptsMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            <Save size={16} />
                            {promptsMutation.isPending ? '保存中...' : '保存提示词配置'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
