import { useState } from 'react';
import { ChevronDown, Flag, Trash, MoreVertical, Tag, List, Paperclip } from 'lucide-react';
import type { Todo, QuadrantType } from '../../types';
import { QUADRANT_CONFIG } from '../../constants';

interface TodoEditViewProps {
  todo: Partial<Todo>;
  onSave: (todo: Todo) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export default function TodoEditView({ todo, onSave, onCancel, onDelete }: TodoEditViewProps) {
  const [title, setTitle] = useState(todo.title || '');
  const [note, setNote] = useState(todo.note || '');
  const [completed, setCompleted] = useState(todo.completed || false);
  const [quadrant, setQuadrant] = useState<QuadrantType>(todo.quadrant || '重要且紧急');
  const config = QUADRANT_CONFIG[quadrant];

  const handleSave = () => { if (!title.trim()) return; onSave({ ...todo, title, note, completed, quadrant } as Todo); };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-1 text-[18px] text-gray-800 font-medium cursor-pointer" onClick={onCancel}>
          <span>收集箱</span><ChevronDown size={20} className="text-gray-500" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select value={quadrant} onChange={(e) => setQuadrant(e.target.value as QuadrantType)} className="absolute inset-0 opacity-0 cursor-pointer">
              <option value="重要且紧急">重要且紧急</option><option value="重要不紧急">重要不紧急</option>
              <option value="不重要但紧急">不重要但紧急</option><option value="不重要不紧急">不重要不紧急</option>
            </select>
            <button className="p-1 pointer-events-none"><Flag size={24} fill={config.color} stroke={config.color} /></button>
          </div>
          {todo.id && <button onClick={() => onDelete(todo.id!)} className="p-1 text-gray-600"><Trash size={24} /></button>}
          <button className="p-1 text-gray-600"><MoreVertical size={24} /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-5 space-y-4">
        <div className="flex items-center gap-3 text-gray-400">
          <button onClick={() => setCompleted(!completed)} className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${completed ? 'bg-[#E5E5EA] border-[#E5E5EA]' : 'bg-white'}`}
            style={!completed ? { borderColor: config.color } : {}}>
            {completed && <div className="w-2.5 h-1.5 border-l-[2px] border-b-[2px] border-white -rotate-45 -mt-0.5" />}
          </button>
          <span className="text-[15px]">日期与提醒</span>
        </div>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="准备做什么？" className="w-full text-[22px] font-medium text-gray-900 outline-none placeholder-gray-300" autoFocus />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="描述" className="w-full h-32 text-[16px] text-gray-600 outline-none resize-none placeholder-gray-400" />
      </div>
      <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-6 text-gray-400 bg-white">
        <Tag size={22} /><List size={22} /><Paperclip size={22} />
        <div className="flex-1"></div>
        <button onClick={handleSave} className="text-[#5B8FF9] font-medium px-4 py-1.5 bg-blue-50 rounded-full">保存</button>
      </div>
    </div>
  );
}
