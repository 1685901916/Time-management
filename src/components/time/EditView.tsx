import React, { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Header from '../common/Header';
import type { TimeEntry, CategoryType } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface EditViewProps {
  entry: Partial<TimeEntry>;
  onSave: (entry: TimeEntry) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export default function EditView({ entry, onSave, onCancel, onDelete }: EditViewProps) {
  const [category, setCategory] = useState<CategoryType>(entry.category || '学习');
  const [startTime, setStartTime] = useState(entry.startTime || '08:00');
  const [endTime, setEndTime] = useState(entry.endTime || '09:00');
  const [note, setNote] = useState(entry.note || '');

  const categories: CategoryType[] = ['睡觉', '学习', '运动', '刷手机', '休息', '信息工作', '户外', '写笔记', '游戏', '琐事'];
  const calculateDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
  };
  const duration = calculateDuration(startTime, endTime);

  const handleSave = () => {
    onSave({ ...entry, category, startTime, endTime, note, durationMinutes: duration } as TimeEntry);
  };

  return (
    <div className="fixed inset-0 bg-white z-[50] flex flex-col">
      <Header title="编辑" onBack={onCancel} rightIcons={
        <div className="flex items-center gap-4">
          <span className="text-sm">今天</span>
          {entry.id && onDelete && (
            <button onClick={() => onDelete(entry.id!)} className="text-sm text-red-100" aria-label="删除"><Trash2 size={18} /></button>
          )}
          <button onClick={handleSave} className="font-bold">确定</button>
        </div>
      } />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gray-50 p-6 flex flex-col items-center justify-center gap-4">
          <div className="text-[#6DADD1] text-2xl font-medium">{Math.floor(duration / 60)}小时{duration % 60}分钟</div>
          <div className="flex items-center gap-8 w-full max-w-xs">
            <div className="flex-1 text-center">
              <p className="text-gray-400 text-xs mb-2">开始时间</p>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-xl font-mono outline-none w-full text-center" />
              </div>
            </div>
            <div className="flex-1 text-center">
              <p className="text-gray-400 text-xs mb-2">结束时间</p>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-xl font-mono outline-none w-full text-center" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#6DADD1] text-white px-3 py-1 rounded text-sm">分类</span>
            <span className="border border-gray-200 text-gray-500 px-3 py-1 rounded text-sm">重要</span>
            <div className="flex-1" />
            <button className="text-[#6DADD1] text-sm flex items-center gap-1"><Plus size={14} /> 向上合并</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`py-2 rounded-full text-sm font-medium transition-all ${category === cat ? 'ring-2 ring-offset-2 ring-gray-400 text-white' : 'text-white/90'}`}
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}>{cat}</button>
            ))}
          </div>
          <div className="mt-8 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">备注</span>
                <button onClick={handleSave} className="bg-[#6DADD1] text-white px-4 py-1 rounded-full text-sm">确定</button>
              </div>
              <textarea
                placeholder="请输入备注，支持 Markdown 格式..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full outline-none text-gray-700 text-sm leading-relaxed resize-none min-h-[96px] bg-gray-50 rounded-xl p-3"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
