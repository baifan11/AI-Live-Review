import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecords } from '../lib/api';
import { Link } from 'react-router-dom';

const Records: React.FC = () => {
    const { data: records, isLoading } = useQuery({
        queryKey: ['records'],
        queryFn: getRecords
    });

    if (isLoading) return <div className="p-8">加载中...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">所有录制记录</h1>
                <div className="text-sm text-gray-500">
                    共 {records?.length || 0} 条记录
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">主播</th>
                            <th className="px-6 py-3 font-medium text-gray-500">记录序号</th>
                            <th className="px-6 py-3 font-medium text-gray-500">状态</th>
                            <th className="px-6 py-3 font-medium text-gray-500">开始时间</th>
                            <th className="px-6 py-3 font-medium text-gray-500">结束时间</th>
                            <th className="px-6 py-3 font-medium text-gray-500">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {records?.map((record) => {
                            // 计算该主播的记录序号
                            const anchorRecords = records?.filter(r => r.anchor_id === record.anchor_id) || [];
                            const recordIndex = anchorRecords.findIndex(r => r.id === record.id) + 1;
                            const recordNumber = String(recordIndex).padStart(2, '0');

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
                                        {record.end_time ? new Date(record.end_time).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link to={`/records/${record.id}`} className="text-blue-600 hover:underline">
                                            查看详情
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!records || records.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    暂无记录
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Records;
