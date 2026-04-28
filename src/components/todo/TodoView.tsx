import { memo, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, Plus } from 'lucide-react';
import type { QuadrantType, Todo } from '../../types';
import { QUADRANT_CONFIG } from '../../constants';
import MarkdownText from '../common/MarkdownText';

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

const QuadrantCard = memo(function QuadrantCard({
  quadrant,
  todos,
  onToggle,
  onEdit,
}: {
  quadrant: QuadrantType;
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
}) {
  const config = QUADRANT_CONFIG[quadrant];

  return (
    <div
      className="flex min-h-[260px] flex-col overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_34px_rgba(15,23,42,0.045)]"
      style={{ borderColor: `${config.color}18` }}
    >
      <div className="flex items-center gap-2 px-5 pb-3 pt-4">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-extrabold"
          style={{ backgroundColor: `${config.color}12`, color: config.color }}
        >
          {config.icon}
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-extrabold leading-tight text-slate-800">{config.label}</div>
          <div className="mt-0.5 text-[11px] font-medium text-slate-400">{todos.length ? `${todos.length} 个待办` : '空闲'}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-5 pb-4">
        {todos.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-100 bg-slate-50/45 text-[13px] font-medium text-slate-300">
            暂无待办
          </div>
        ) : (
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 scrollbar-hide">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="group cursor-pointer rounded-2xl border border-transparent bg-slate-50/70 px-3 py-2.5 transition-colors hover:border-slate-100 hover:bg-white"
                onClick={() => onEdit(todo)}
              >
                <div className="flex items-start gap-3">
                  <motion.button
                    whileTap={{ scale: 0.86 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(todo.id);
                    }}
                    className={`mt-0.5 flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors ${
                      todo.completed ? 'border-slate-200 bg-slate-200' : 'bg-white'
                    }`}
                    style={!todo.completed ? { borderColor: config.color } : {}}
                  >
                    {todo.completed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="-mt-0.5 h-1.5 w-2.5 rotate-[-45deg] border-b-[2px] border-l-[2px] border-white"
                      />
                    )}
                  </motion.button>

                  <div className="min-w-0 flex-1">
                    <span className={`block truncate text-[14px] font-semibold leading-snug ${todo.completed ? 'text-[#C7C7CC] line-through' : 'text-slate-800'}`}>
                      {todo.title}
                    </span>
                    {todo.note && (
                      <MarkdownText
                        text={todo.note}
                        className={`mt-0.5 truncate text-[11px] ${todo.completed ? 'text-[#C7C7CC] line-through' : 'text-slate-400'}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {todos.length > 4 && (
          <div className="mt-2 shrink-0 text-center">
            <button className="text-[12px] text-[#C7C7CC] transition-colors hover:text-gray-400">查看更多</button>
          </div>
        )}
      </div>
    </div>
  );
});

function QuickAddTodoModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (title: string, quadrant: QuadrantType, note?: string) => void;
}) {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoNote, setNewTodoNote] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType>('重要且紧急');
  const [showQuadrantPicker, setShowQuadrantPicker] = useState(false);

  const handleQuickAdd = () => {
    if (!newTodoTitle.trim()) return;
    onAdd(newTodoTitle.trim(), selectedQuadrant, newTodoNote.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative z-10 flex h-[50vh] w-full flex-col rounded-t-[24px] bg-white shadow-2xl lg:h-auto lg:max-h-[620px] lg:max-w-xl lg:rounded-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 pb-3 pt-5">
          <span className="text-[16px] font-bold text-gray-800">新建待办</span>
          <button onClick={onClose} className="cursor-pointer text-sm text-gray-400">
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
            placeholder="添加描述或备注，支持 Markdown 格式..."
            value={newTodoNote}
            onChange={(event) => setNewTodoNote(event.target.value)}
            className="min-h-[120px] w-full flex-1 resize-none rounded-xl border border-transparent bg-gray-50 p-3 text-[15px] leading-relaxed text-gray-600 outline-none placeholder-gray-300 focus:border-slate-300 focus:ring-4 focus:ring-slate-100 lg:min-h-[160px]"
          />
        </div>

        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4">
          {showQuadrantPicker && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quadrants.map((quadrant) => (
                <button
                  key={quadrant}
                  onClick={() => {
                    setSelectedQuadrant(quadrant);
                    setShowQuadrantPicker(false);
                  }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
                  style={{ backgroundColor: `${QUADRANT_CONFIG[quadrant].color}18`, color: QUADRANT_CONFIG[quadrant].color }}
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
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowQuadrantPicker((value) => !value)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5"
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
              className="rounded-full bg-teal-600 px-6 py-2 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodoView({ todos, onAdd, onToggle, onEdit, onMoreClick }: TodoViewProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const filteredTodos = useMemo(() => todos.filter((todo) => !todo.isArchived), [todos]);

  return (
    <div className="min-h-screen bg-[#F7FBFA] pb-20 lg:h-screen lg:overflow-hidden lg:pb-0">
      <header className="flex items-center justify-between px-5 pb-4 pt-6 lg:px-6 lg:pt-7">
        <h1 className="text-[24px] font-extrabold tracking-wide text-[#1C1C1E]">四象限待办</h1>
        <button onClick={onMoreClick} className="cursor-pointer p-1 text-gray-500">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 pb-6 sm:grid-cols-2 lg:h-[calc(100vh-104px)] lg:grid-rows-2 lg:px-6">
        {quadrants.map((quadrant) => (
          <QuadrantCard
            key={quadrant}
            quadrant={quadrant}
            todos={filteredTodos.filter((todo) => todo.quadrant === quadrant)}
            onToggle={onToggle}
            onEdit={onEdit}
          />
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-float lg:bottom-8 lg:right-8"
        onClick={() => setIsQuickAddOpen(true)}
      >
        <Plus size={32} strokeWidth={2} />
      </motion.button>

      {isQuickAddOpen && <QuickAddTodoModal onClose={() => setIsQuickAddOpen(false)} onAdd={onAdd} />}
    </div>
  );
}
