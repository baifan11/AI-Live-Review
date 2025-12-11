import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTasks, getRecords } from '../lib/api';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { data: tasks } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: records } = useQuery({ queryKey: ['records'], queryFn: getRecords });

    const activeTasks = tasks?.filter(t => t.is_active).length || 0;
    const totalRecords = records?.length || 0;
    const recentRecords = records?.slice(0, 5) || [];

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-muted-foreground">Active Tasks</div>
                    <div className="text-2xl font-bold">{activeTasks}</div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border">
                    <div className="text-sm font-medium text-muted-foreground">Total Records</div>
                    <div className="text-2xl font-bold">{totalRecords}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Recordings</h2>
                    <Link to="/records" className="text-sm text-blue-600 hover:underline">View all</Link>
                </div>

                <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">主播</th>
                                <th className="px-6 py-3 font-medium text-gray-500">记录序号</th>
                                <th className="px-6 py-3 font-medium text-gray-500">状态</th>
                                <th className="px-6 py-3 font-medium text-gray-500">开始时间</th>
                                <th className="px-6 py-3 font-medium text-gray-500">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {recentRecords.map((record) => {
                                // 计算该主播的记录序号
                                // 计算该主播的记录序号
                                const anchorRecords = records?.filter(r => r.anchor_id === record.anchor_id) || [];
                                const totalRecords = anchorRecords.length;
                                const currentIndex = anchorRecords.findIndex(r => r.id === record.id);
                                const recordNumber = String(totalRecords - currentIndex).padStart(2, '0');

                                return (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{record.anchor_name || record.anchor_id || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">ID: {record.anchor_id}</div>
                                        </td>
                                        <td className="px-6 py-4">#{recordNumber}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${record.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(record.start_time).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <Link to={`/records/${record.id}`} className="text-blue-600 hover:underline">查看</Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {recentRecords.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">暂无记录</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
