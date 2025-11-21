import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecord } from '../lib/api';
import { Download, FileText, FileVideo } from 'lucide-react';

const RecordDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: record, isLoading } = useQuery({
        queryKey: ['record', id],
        queryFn: () => getRecord(parseInt(id!))
    });

    const [transcript, setTranscript] = useState<any[]>([]);

    // 加载转写内容
    useEffect(() => {
        if (record?.transcript_path) {
            fetch(`http://localhost:8000/${record.transcript_path}`)
                .then(res => res.json())
                .then(data => {
                    // 处理转写数据，合并成完整语句
                    const sentences = mergeSentences(data);
                    setTranscript(sentences);
                })
                .catch(err => console.error('Failed to load transcript:', err));
        }
    }, [record]);

    // 合并转写片段为完整语句
    const mergeSentences = (data: any[]): any[] => {
        if (!Array.isArray(data)) return [];

        const sentences: any[] = [];
        let currentSentence = '';
        let startTime = 0;
        let endTime = 0;

        data.forEach((item, index) => {
            const text = item.text || item.Text || '';
            const begin = item.begin_time || item.BeginTime || 0;
            const end = item.end_time || item.EndTime || 0;

            if (index === 0) {
                startTime = begin;
            }

            currentSentence += text;
            endTime = end;

            // 判断是否为句子结尾
            if (text.match(/[。！？.!?]$/) || index === data.length - 1) {
                if (currentSentence.trim()) {
                    sentences.push({
                        text: currentSentence.trim(),
                        begin_time: startTime,
                        end_time: endTime
                    });
                }
                currentSentence = '';
                startTime = 0;
            }
        });

        return sentences;
    };

    // 格式化时间（毫秒转 mm:ss），支持绝对时间显示
    const formatTime = (ms: number, isAbsolute: boolean = false): string => {
        let totalMs = ms;

        // 如果是绝对时间，需要加上录制开始时间
        if (isAbsolute && record?.start_time) {
            const startTime = new Date(record.start_time).getTime();
            totalMs = startTime + ms;
        }

        const seconds = Math.floor(totalMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 下载视频
    const downloadVideo = () => {
        if (!record?.video_path) return;
        const link = document.createElement('a');
        link.href = `http://localhost:8000/${record.video_path}`;
        link.download = `record_${record.id}.mp4`;
        link.click();
    };

    // 导出转写文本
    const exportTranscript = (format: 'txt' | 'md') => {
        let content = '';

        if (format === 'txt') {
            content = transcript.map(s =>
                `[${formatTime(s.begin_time, true)} - ${formatTime(s.end_time, true)}] ${s.text}`
            ).join('\n\n');
        } else {
            content = `# 录制记录 #${record?.id} 转写稿\n\n`;
            content += `**主播**: ${record?.anchor_name || record?.anchor_id}\n`;
            content += `**时间**: ${record?.start_time ? new Date(record.start_time).toLocaleString() : ''}\n\n`;
            content += `---\n\n`;
            content += transcript.map(s =>
                `**[${formatTime(s.begin_time, true)} - ${formatTime(s.end_time, true)}]**\n\n${s.text}\n`
            ).join('\n');
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transcript_${record?.id}.${format}`;
        link.click();
    };

    // 导出分析报告
    const exportAnalysis = (format: 'txt' | 'md') => {
        if (!record?.analysis_result) return;

        let content = '';
        if (format === 'md') {
            content = record.analysis_result;
        } else {
            // 移除 Markdown 格式
            content = record.analysis_result
                .replace(/#{1,6}\s/g, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '');
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analysis_${record?.id}.${format}`;
        link.click();
    };

    if (isLoading) return <div className="p-8">加载中...</div>;
    if (!record) return <div className="p-8">记录未找到</div>;

    const videoUrl = `http://localhost:8000/${record.video_path}`;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">录制记录 #{record.id}</h1>
                    <p className="text-gray-500 mt-1">
                        {record.anchor_name || record.anchor_id} · {new Date(record.start_time).toLocaleString()}
                    </p>
                </div>

                {/* 下载按钮组 */}
                <div className="flex gap-2">
                    <button
                        onClick={downloadVideo}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={!record.video_path}
                    >
                        <FileVideo size={18} />
                        下载视频
                    </button>
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                            <FileText size={18} />
                            导出转写稿
                        </button>
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-10">
                            <div className="py-1">
                                <button
                                    onClick={() => exportTranscript('txt')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2"
                                >
                                    <span className="text-xs text-gray-400">TXT</span>
                                    纯文本格式
                                </button>
                                <button
                                    onClick={() => exportTranscript('md')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2"
                                >
                                    <span className="text-xs text-gray-400">MD</span>
                                    Markdown格式
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={!record.analysis_result}
                        >
                            <Download size={18} />
                            导出报告
                        </button>
                        <div className={`absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border transition-all duration-200 transform translate-y-1 z-10 ${record.analysis_result ? 'opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0' : 'opacity-0 invisible'}`}>
                            <div className="py-1">
                                <button
                                    onClick={() => exportAnalysis('txt')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2"
                                    disabled={!record.analysis_result}
                                >
                                    <span className="text-xs text-gray-400">TXT</span>
                                    纯文本格式
                                </button>
                                <button
                                    onClick={() => exportAnalysis('md')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2"
                                    disabled={!record.analysis_result}
                                >
                                    <span className="text-xs text-gray-400">MD</span>
                                    Markdown格式
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Video & Transcript */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Video Player */}
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full h-full"
                        />
                    </div>

                    {/* Transcript */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">转写稿</h2>
                        <div className="h-96 overflow-y-auto space-y-4 bg-gray-50 p-4 rounded-lg">
                            {transcript.length > 0 ? (
                                transcript.map((sentence, index) => (
                                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <div className="text-xs text-gray-500 mb-1">
                                            {formatTime(sentence.begin_time, true)} - {formatTime(sentence.end_time, true)}
                                        </div>
                                        <div className="text-gray-800">{sentence.text}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 italic text-center py-8">
                                    {record.transcript_path ? '加载中...' : '暂无转写内容'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Analysis */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">AI 分析报告</h2>
                        <div className="prose prose-sm max-w-none">
                            {record.analysis_result ? (
                                <div className="whitespace-pre-wrap text-gray-700">{record.analysis_result}</div>
                            ) : (
                                <div className="text-gray-400 italic">暂无分析报告</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">元数据</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">主播</span>
                                <span className="font-medium">{record.anchor_name || record.anchor_id}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">状态</span>
                                <span className={`font-medium px-2 py-0.5 rounded-full text-xs capitalize
                      ${record.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                                        record.status === 'failed' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'}`}>
                                    {record.status}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">开始时间</span>
                                <span className="font-medium">{new Date(record.start_time).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">时长</span>
                                <span className="font-medium">
                                    {record.end_time ?
                                        Math.round((new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 1000) + '秒'
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordDetail;
