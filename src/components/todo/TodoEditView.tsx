import { useState } from 'react';
import { ChevronDown, Flag, List, MoreVertical, Paperclip, Tag, Trash, X } from 'lucide-react';
import type { QuadrantType, Todo } from '../../types';
import { QUADRANT_CONFIG } from '../../constants';
import MarkdownText from '../common/MarkdownText';

interface TodoEditViewProps {
  todo: Partial<Todo>;
  onSave: (todo: Todo) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export default function TodoEditView({ todo, onSave, onCancel, onDelete }: TodoEditViewProps) {
  const [title, setTitle] = useState(todo.title || '');
  const [note, setNote] = useState(todo.note || '');
  const [isEditingNote, setIsEditingNote] = useState(!todo.note?.trim());
  const [completed, setCompleted] = useState(todo.completed || false);
  const [quadrant, setQuadrant] = useState<QuadrantType>(todo.quadrant || '重要且紧急');
  const config = QUADRANT_CONFIG[quadrant];

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ ...todo, title: title.trim(), note, completed, quadrant } as Todo);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end bg-slate-950/35 lg:items-center lg:justify-center lg:p-6">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative z-10 flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:max-w-xl lg:rounded-[24px]">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-5 pb-4 pt-5">
          <button className="flex cursor-pointer items-center gap-1 text-[17px] font-semibold text-gray-800" onClick={onCancel}>
            <span className="lg:hidden">收起编辑</span>
            <ChevronDown size={20} className="text-gray-500 lg:hidden" />
            <X size={20} className="hidden text-gray-500 lg:block" />
            <span className="hidden lg:block text-slate-900">编辑待办</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select value={quadrant} onChange={(event) => setQuadrant(event.target.value as QuadrantType)} className="absolute inset-0 cursor-pointer opacity-0">
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
              <button onClick={() => onDelete(todo.id!)} className="cursor-pointer p-1 text-gray-600">
                <Trash size={22} />
              </button>
            )}

            <button className="cursor-pointer p-1 text-gray-600">
              <MoreVertical size={22} />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] px-5 py-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => setCompleted(!completed)}
                className={`flex h-6 w-6 items-center justify-center rounded-[8px] border-[1.5px] transition-colors ${
                  completed ? 'border-slate-200 bg-slate-200' : 'bg-white'
                }`}
                style={!completed ? { borderColor: config.color } : {}}
              >
                {completed && <div className="-mt-0.5 h-1.5 w-2.5 rotate-[-45deg] border-b-[2px] border-l-[2px] border-white" />}
              </button>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${config.color}12`, color: config.color }}>
                {config.label}
              </span>
              <span className="ml-auto text-xs font-medium text-slate-400">日期与提醒</span>
            </div>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="准备做什么？"
              className="w-full bg-transparent text-[22px] font-semibold text-slate-900 outline-none placeholder-gray-300"
              autoFocus
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">备注</span>
              <button
                type="button"
                onClick={() => setIsEditingNote((value) => !value)}
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                {isEditingNote ? '预览' : '编辑 Markdown'}
              </button>
            </div>

            {isEditingNote ? (
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="添加描述或备注，支持 Markdown 格式"
                className="h-36 w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-600 outline-none placeholder-gray-400"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="min-h-36 w-full rounded-xl text-left transition-colors hover:bg-slate-50"
              >
                {note.trim() ? (
                  <MarkdownText text={note} className="p-3 text-[15px] leading-relaxed text-slate-600" />
                ) : (
                  <span className="block p-3 text-[15px] text-slate-300">添加描述或备注，支持 Markdown 格式</span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 border-t border-gray-100 bg-white px-5 py-4 text-gray-400">
          <Tag size={22} />
          <List size={22} />
          <Paperclip size={22} />
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
            disabled={!title.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
