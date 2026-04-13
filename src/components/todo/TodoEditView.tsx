import { useState } from 'react';
import { ChevronDown, Flag, List, MoreVertical, Paperclip, Tag, Trash } from 'lucide-react';
import type { QuadrantType, Todo } from '../../types';
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

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ ...todo, title: title.trim(), note, completed, quadrant } as Todo);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 pt-6 pb-4">
        <div className="flex cursor-pointer items-center gap-1 text-[18px] font-medium text-gray-800" onClick={onCancel}>
          <span>收起编辑</span>
          <ChevronDown size={20} className="text-gray-500" />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={quadrant}
              onChange={(event) => setQuadrant(event.target.value as QuadrantType)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="重要且紧急">重要且紧急</option>
              <option value="重要不紧急">重要不紧急</option>
              <option value="不重要但紧急">不重要但紧急</option>
              <option value="不重要不紧急">不重要不紧急</option>
            </select>
            <button className="pointer-events-none p-1">
              <Flag size={24} fill={config.color} stroke={config.color} />
            </button>
          </div>

          {todo.id && (
            <button onClick={() => onDelete(todo.id!)} className="p-1 text-gray-600">
              <Trash size={24} />
            </button>
          )}

          <button className="p-1 text-gray-600">
            <MoreVertical size={24} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 space-y-4">
        <div className="flex items-center gap-3 text-gray-400">
          <button
            onClick={() => setCompleted(!completed)}
            className={`flex h-5 w-5 items-center justify-center rounded-[6px] border-[1.5px] transition-colors ${
              completed ? 'border-[#E5E5EA] bg-[#E5E5EA]' : 'bg-white'
            }`}
            style={!completed ? { borderColor: config.color } : {}}
          >
            {completed && <div className="-mt-0.5 h-1.5 w-2.5 rotate-[-45deg] border-l-[2px] border-b-[2px] border-white" />}
          </button>
          <span className="text-[15px]">日期与提醒</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="准备做什么？"
          className="w-full text-[22px] font-medium text-gray-900 outline-none placeholder-gray-300"
          autoFocus
        />

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="描述"
          className="h-32 w-full resize-none text-[16px] text-gray-600 outline-none placeholder-gray-400"
        />
      </div>

      <div className="flex items-center gap-6 border-t border-gray-100 bg-white px-5 py-4 text-gray-400">
        <Tag size={22} />
        <List size={22} />
        <Paperclip size={22} />
        <div className="flex-1" />
        <button onClick={handleSave} className="rounded-full bg-blue-50 px-4 py-1.5 font-medium text-[#5B8FF9]">
          保存
        </button>
      </div>
    </div>
  );
}
