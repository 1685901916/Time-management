import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, Plus } from 'lucide-react';
import type { QuadrantType, Todo } from '../../types';
import { getLocalDateString, QUADRANT_CONFIG } from '../../constants';

interface TodoViewProps {
  todos: Todo[];
  onAdd: (title: string, quadrant: QuadrantType, note?: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDateClick: () => void;
  onMoreClick: () => void;
}

const quadrants: QuadrantType[] = ['重要且紧急', '重要不紧急', '不重要但紧急', '不重要不紧急'];

export default function TodoView({
  todos,
  onAdd,
  onToggle,
  onEdit,
  onMoreClick,
}: TodoViewProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoNote, setNewTodoNote] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType>('重要且紧急');
  const [showQuadrantPicker, setShowQuadrantPicker] = useState(false);

  const filteredTodos = useMemo(() => todos.filter((todo) => !todo.isArchived), [todos]);

  const handleQuickAdd = () => {
    if (!newTodoTitle.trim()) return;
    onAdd(newTodoTitle.trim(), selectedQuadrant, newTodoNote.trim() || undefined);
    setNewTodoTitle('');
    setNewTodoNote('');
    setIsQuickAddOpen(false);
    setShowQuadrantPicker(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-20">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-extrabold tracking-wide text-[#1C1C1E]">四象限待办</h1>
        <button onClick={onMoreClick} className="p-1 text-gray-500">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="grid h-[calc(100vh-140px)] grid-cols-2 gap-3 px-4 pb-4">
        {quadrants.map((quadrant) => {
          const config = QUADRANT_CONFIG[quadrant];
          const quadrantTodos = filteredTodos.filter((todo) => todo.quadrant === quadrant);

          return (
            <div key={quadrant} className="flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 px-4 pt-5 pb-3">
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </span>
                <span className="text-[14px] font-bold" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>

              <div className="flex flex-1 flex-col px-4 pb-4 overflow-hidden">
                <div className="flex-1 space-y-3.5 overflow-y-auto scrollbar-hide">
                  {quadrantTodos.map((todo) => (
                    <div key={todo.id} className="group flex flex-col gap-1 cursor-pointer" onClick={() => onEdit(todo)}>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggle(todo.id);
                          }}
                          className={`mt-0.5 flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors ${
                            todo.completed ? 'border-[#E5E5EA] bg-[#E5E5EA]' : 'bg-white'
                          }`}
                          style={!todo.completed ? { borderColor: config.color } : {}}
                        >
                          {todo.completed && <div className="-mt-0.5 h-1.5 w-2.5 rotate-[-45deg] border-l-[2px] border-b-[2px] border-white" />}
                        </button>

                        <div className="flex flex-1 flex-col">
                          <span className={`text-[14px] leading-snug ${todo.completed ? 'line-through text-[#C7C7CC]' : 'text-[#333333]'}`}>
                            {todo.title}
                          </span>
                          {todo.note && (
                            <span className={`mt-0.5 line-clamp-1 text-[11px] ${todo.completed ? 'line-through text-[#C7C7CC]' : 'text-gray-400'}`}>
                              {todo.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 text-center shrink-0">
                  <button className="text-[12px] text-[#C7C7CC] transition-colors hover:text-gray-400">查看更多</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#5B8FF9] text-white shadow-[0_8px_20px_rgba(91,143,249,0.4)] transition-transform active:scale-95"
        onClick={() => setIsQuickAddOpen(true)}
      >
        <Plus size={32} strokeWidth={2} />
      </button>

      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsQuickAddOpen(false)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="flex h-[50vh] flex-col rounded-t-[24px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 pt-5 pb-3 flex-shrink-0">
              <span className="text-[16px] font-bold text-gray-800">新建待办</span>
              <button onClick={() => setIsQuickAddOpen(false)} className="text-sm text-gray-400">
                取消
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
              <input
                autoFocus
                type="text"
                placeholder="准备做什么？"
                value={newTodoTitle}
                onChange={(event) => setNewTodoTitle(event.target.value)}
                className="w-full bg-transparent text-[18px] font-medium text-gray-800 outline-none placeholder-gray-300"
              />
              <textarea
                placeholder="添加描述或备注..."
                value={newTodoNote}
                onChange={(event) => setNewTodoNote(event.target.value)}
                className="min-h-[120px] w-full flex-1 resize-none rounded-xl bg-gray-50 p-3 text-[15px] leading-relaxed text-gray-600 outline-none placeholder-gray-300"
              />
            </div>

            <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
              {showQuadrantPicker && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex flex-wrap gap-2">
                  {quadrants.map((quadrant) => (
                    <button
                      key={quadrant}
                      onClick={() => {
                        setSelectedQuadrant(quadrant);
                        setShowQuadrantPicker(false);
                      }}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
                      style={{ backgroundColor: `${QUADRANT_CONFIG[quadrant].color}20`, color: QUADRANT_CONFIG[quadrant].color }}
                    >
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: QUADRANT_CONFIG[quadrant].color }}
                      >
                        {QUADRANT_CONFIG[quadrant].icon}
                      </span>
                      {QUADRANT_CONFIG[quadrant].label}
                    </button>
                  ))}
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowQuadrantPicker((value) => !value)}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: QUADRANT_CONFIG[selectedQuadrant].color }}
                  >
                    {QUADRANT_CONFIG[selectedQuadrant].icon}
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: QUADRANT_CONFIG[selectedQuadrant].color }}>
                    {QUADRANT_CONFIG[selectedQuadrant].label}
                  </span>
                </button>

                <button
                  onClick={handleQuickAdd}
                  disabled={!newTodoTitle.trim()}
                  className="rounded-full bg-[#5B8FF9] px-6 py-2 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-40"
                >
                  添加
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
