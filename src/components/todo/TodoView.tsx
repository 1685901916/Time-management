import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, Plus } from 'lucide-react';
import type { Todo, QuadrantType } from '../../types';
import { QUADRANT_CONFIG, getLocalDateString } from '../../constants';

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

export default function TodoView({ todos, onAdd, onToggle, onDelete, onEdit, selectedDate, onDateChange, onDateClick, onMoreClick }: TodoViewProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoNote, setNewTodoNote] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType>('重要且紧急');
  const [showQuadrantPicker, setShowQuadrantPicker] = useState(false);

  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;
  const handlePrevDay = () => { const [y, m, d] = selectedDate.split('-').map(Number); onDateChange(getLocalDateString(new Date(y, m - 1, d - 1))); };
  const handleNextDay = () => { const [y, m, d] = selectedDate.split('-').map(Number); onDateChange(getLocalDateString(new Date(y, m - 1, d + 1))); };

  const displayDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (isToday) return '今天';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === getLocalDateString(yesterday)) return '昨天';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDate === getLocalDateString(tomorrow)) return '明天';
    return `${m}月${d}日`;
  }, [selectedDate, isToday]);

  const filteredTodos = todos.filter(todo => !todo.isArchived);
  const handleQuickAdd = () => { if (!newTodoTitle.trim()) return; onAdd(newTodoTitle, selectedQuadrant, newTodoNote.trim() || undefined); setNewTodoTitle(''); setNewTodoNote(''); setIsQuickAddOpen(false); setShowQuadrantPicker(false); };

  return (
    <div className="pb-20 min-h-screen bg-[#F5F6F8]">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-[24px] font-extrabold text-[#1C1C1E] tracking-wide">四象限待办</h1>
        <button onClick={onMoreClick} className="p-1 text-gray-500"><MoreVertical size={24} /></button>
      </header>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3 h-[calc(100vh-140px)]">
        {quadrants.map((q) => {
          const config = QUADRANT_CONFIG[q];
          const quadrantTodos = filteredTodos.filter(t => t.quadrant === q);
          return (
            <div key={q} className="flex flex-col bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="px-4 pt-5 pb-3 flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] text-white font-bold" style={{ backgroundColor: config.color }}>{config.icon}</span>
                <span className="text-[14px] font-bold" style={{ color: config.color }}>{config.label}</span>
              </div>
              <div className="flex-1 flex flex-col px-4 pb-4 overflow-hidden">
                <div className="space-y-3.5 overflow-y-auto scrollbar-hide flex-1">
                  {quadrantTodos.map((todo) => (
                    <div key={todo.id} className="flex flex-col gap-1 group cursor-pointer" onClick={() => onEdit(todo)}>
                      <div className="flex items-start gap-3">
                        <button onClick={(e) => { e.stopPropagation(); onToggle(todo.id); }}
                          className={`mt-0.5 w-[20px] h-[20px] rounded-[6px] border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors ${todo.completed ? 'bg-[#E5E5EA] border-[#E5E5EA]' : 'bg-white'}`}
                          style={!todo.completed ? { borderColor: config.color } : {}}>
                          {todo.completed && <div className="w-2.5 h-1.5 border-l-[2px] border-b-[2px] border-white -rotate-45 -mt-0.5" />}
                        </button>
                        <div className="flex-1 flex flex-col">
                          <span className={`text-[14px] leading-snug ${todo.completed ? 'text-[#C7C7CC] line-through' : 'text-[#333333]'}`}>{todo.title}</span>
                          {todo.note && <span className={`text-[11px] mt-0.5 line-clamp-1 ${todo.completed ? 'text-[#C7C7CC] line-through' : 'text-gray-400'}`}>{todo.note}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 text-center shrink-0"><button className="text-[12px] text-[#C7C7CC] hover:text-gray-400 transition-colors">查看更多</button></div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="fixed bottom-24 right-6 bg-[#5B8FF9] text-white w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(91,143,249,0.4)] flex items-center justify-center active:scale-95 transition-transform z-40" onClick={() => setIsQuickAddOpen(true)}>
        <Plus size={32} strokeWidth={2} />
      </button>

      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsQuickAddOpen(false)} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: 'tween', duration: 0.2 }} className="relative bg-white rounded-t-[24px] shadow-2xl flex flex-col h-[50vh]">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <span className="text-[16px] font-bold text-gray-800">新建待办</span>
              <button onClick={() => setIsQuickAddOpen(false)} className="text-gray-400 text-sm">取消</button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <input
                autoFocus
                type="text"
                placeholder="准备做什么？"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="w-full bg-transparent outline-none text-[18px] font-medium text-gray-800 placeholder-gray-300"
              />
              <textarea
                placeholder="添加描述或备注..."
                value={newTodoNote}
                onChange={(e) => setNewTodoNote(e.target.value)}
                className="w-full flex-1 bg-gray-50 rounded-xl p-3 outline-none text-[15px] text-gray-600 placeholder-gray-300 resize-none leading-relaxed min-h-[120px]"
              />
            </div>

            {/* Quadrant picker + submit */}
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              {showQuadrantPicker && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex flex-wrap gap-2">
                  {quadrants.map(q => (
                    <button key={q} onClick={() => { setSelectedQuadrant(q); setShowQuadrantPicker(false); }}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-colors ${selectedQuadrant === q ? 'ring-2 ring-offset-1' : ''}`}
                      style={{ backgroundColor: QUADRANT_CONFIG[q].color + '20', color: QUADRANT_CONFIG[q].color, ...(selectedQuadrant === q ? { ringColor: QUADRANT_CONFIG[q].color } : {}) }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold" style={{ backgroundColor: QUADRANT_CONFIG[q].color }}>{QUADRANT_CONFIG[q].icon}</span>
                      {QUADRANT_CONFIG[q].label}
                    </button>
                  ))}
                </motion.div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowQuadrantPicker(!showQuadrantPicker)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: QUADRANT_CONFIG[selectedQuadrant].color }}>{QUADRANT_CONFIG[selectedQuadrant].icon}</span>
                    <span className="text-[13px] font-medium" style={{ color: QUADRANT_CONFIG[selectedQuadrant].color }}>{QUADRANT_CONFIG[selectedQuadrant].label}</span>
                  </button>
                </div>
                <button
                  onClick={handleQuickAdd}
                  disabled={!newTodoTitle.trim()}
                  className="bg-[#5B8FF9] text-white px-6 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform disabled:opacity-40"
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
