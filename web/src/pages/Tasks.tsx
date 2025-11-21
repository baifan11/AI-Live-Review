import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, deleteTask, pauseTask, resumeTask } from '../lib/api';
import type { Task } from '../lib/api';
import { Plus, Trash2, Play, Pause } from 'lucide-react';

const Tasks: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: tasks, isLoading, error } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newTask, setNewTask] = useState<Partial<Task>>({
        url: '',
        anchor_id: '',
        anchor_name: '',
        interval: 300,
        duration: 60,
        max_recordings: 0,
        ai_enabled: true
    });

    const createMutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsModalOpen(false);
            setNewTask({ url: '', anchor_id: '', anchor_name: '', interval: 300, duration: 60, max_recordings: 0, ai_enabled: true });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const pauseMutation = useMutation({
        mutationFn: pauseTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const resumeMutation = useMutation({
        mutationFn: resumeTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.url) {
            createMutation.mutate(newTask as Task);
        }
    };

    if (isLoading) return <div className="p-8">加载中...</div>;
    if (error) return <div className="p-8 text-red-600">加载失败，请检查后端服务是否运行。错误: {error.message}</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Tasks</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                    <Plus size={16} /> New Task
                </button>
            </div>

            <div className="grid gap-4">
                {tasks?.map((task) => (
                    <div key={task.id} className="p-6 bg-white rounded-xl border flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="font-medium">{task.anchor_name || task.url}</div>
                            <div className="text-sm text-gray-500">
                                主播ID: {task.anchor_id || 'N/A'} | 间隔: {task.interval}s | 时长: {task.duration}s | 段数: {task.max_recordings || '∞'} | AI: {task.ai_enabled ? '开启' : '关闭'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs ${task.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {task.is_active ? 'Active' : 'Inactive'}
                            </div>
                            {task.is_active ? (
                                <button
                                    onClick={() => pauseMutation.mutate(task.id!)}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                                    title="暂停任务"
                                >
                                    <Pause size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => resumeMutation.mutate(task.id!)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                                    title="恢复任务"
                                >
                                    <Play size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => deleteMutation.mutate(task.id!)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="删除任务"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Create New Task</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Live URL</label>
                                <input
                                    type="text"
                                    value={newTask.url}
                                    onChange={e => setNewTask({ ...newTask, url: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="https://live.douyin.com/..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">主播ID</label>
                                <input
                                    type="text"
                                    value={newTask.anchor_id}
                                    onChange={e => setNewTask({ ...newTask, anchor_id: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="例如: anchor_001"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">主播名称</label>
                                <input
                                    type="text"
                                    value={newTask.anchor_name}
                                    onChange={e => setNewTask({ ...newTask, anchor_name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="例如: 小雨"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">间隔时长 (秒)</label>
                                    <input
                                        type="number"
                                        value={newTask.interval}
                                        onChange={e => setNewTask({ ...newTask, interval: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">录制时长 (秒)</label>
                                    <input
                                        type="number"
                                        value={newTask.duration}
                                        onChange={e => setNewTask({ ...newTask, duration: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">录制段数</label>
                                    <input
                                        type="number"
                                        value={newTask.max_recordings}
                                        onChange={e => setNewTask({ ...newTask, max_recordings: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded"
                                        placeholder="0=无限制"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newTask.ai_enabled}
                                    onChange={e => setNewTask({ ...newTask, ai_enabled: e.target.checked })}
                                />
                                <label className="text-sm">Enable AI Analysis</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
