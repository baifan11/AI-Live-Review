import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export interface Task {
    id?: number;
    url: string;
    platform: string;
    anchor_id: string;
    anchor_name: string;
    interval: number;
    duration: number;
    loop_count: number;
    max_recordings: number;
    audio_only: boolean;
    ai_enabled: boolean;
    prompt_transcript?: string;
    prompt_vision?: string;
    prompt_summary?: string;
    is_active: boolean;
    created_at?: string;
}

export interface Record {
    id: number;
    task_id: number;
    anchor_id: string;
    anchor_name: string;
    start_time: string;
    end_time?: string;
    video_path?: string;
    audio_path?: string;
    cover_path?: string;
    status: string;
    transcript_path?: string;
    analysis_result?: string;
}

export interface Settings {
    key: string;
    value: string;
}

export const getTasks = async () => {
    const response = await api.get<Task[]>('/tasks/');
    return response.data;
};

export const createTask = async (task: Task) => {
    const response = await api.post<Task>('/tasks/', task);
    return response.data;
};

export const updateTask = async (id: number, task: Partial<Task>) => {
    const response = await api.put<Task>(`/tasks/${id}`, task);
    return response.data;
};

export const deleteTask = async (id: number) => {
    await api.delete(`/tasks/${id}`);
};

export const pauseTask = async (id: number) => {
    const response = await api.post(`/tasks/${id}/pause`);
    return response.data;
};

export const resumeTask = async (id: number) => {
    const response = await api.post(`/tasks/${id}/resume`);
    return response.data;
};

export const getRecords = async () => {
    const response = await api.get<Record[]>('/records/');
    return response.data;
};

export const getRecord = async (id: number) => {
    const response = await api.get<Record>(`/records/${id}`);
    return response.data;
};

export const getSetting = async (key: string) => {
    try {
        const response = await api.get<Settings>(`/settings/${key}`);
        return response.data;
    } catch (error) {
        return null;
    }
}

export const updateSetting = async (key: string, value: string) => {
    const response = await api.put<Settings>('/settings/', { key, value });
    return response.data;
}

export const getSettingsBatch = async (keys: string[]): Promise<{ [key: string]: string | null }> => {
    const response = await api.get(`/settings-batch/?keys=${keys.join(',')}`);
    return response.data;
}

export const updateSettingsBatch = async (settings: { [key: string]: string }) => {
    const response = await api.post('/settings-batch/', settings);
    return response.data;
}
