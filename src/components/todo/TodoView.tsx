import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, Plus } from 'lucide-react';
import type { QuadrantType, Todo } from '../../types';
import { QUADRANT_CONFIG } from '../../constants';
import MarkdownText from '../common/MarkdownText';
import PageHeader from '../common/PageHeader';
import QuadrantDetailView from './QuadrantDetailView';

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

const PREVIEW_LIMIT = 6;

function sortTodosForCard(todos: Todo[]) {
  return [...todos].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
}

const QuadrantCard = memo(function QuadrantCard({
  quadrant,
  todos,
  onToggle,
  onEdit,
  onOpenDetail,
}: {
  quadrant: QuadrantType;
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onOpenDetail: (quadrant: QuadrantType) => void;
}) {
  const config = QUADRANT_CONFIG[quadrant];
  const ordered = useMemo(() => sortTodosForCard(todos), [todos]);
  const visible = ordered.slice(0, PREVIEW_LIMIT);
  const hasMore = ordered.length > PREVIEW_LIMIT;

  return (
    <div
      className="flex h-full min-h-[260px] flex-col overflow-hidden rounded-[20px] border bg-white shadow-[0_12px_34px_rgba(15,23,42,0.045)]"
      style={{ borderColor: `${config.color}18` }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(quadrant)}
        className="flex w-full items-center gap-2 px-3 pb-2 pt-3 text-left sm:px-5 sm:pb-3 sm:pt-4"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold sm:h-8 sm:w-8 sm:text-[11px]"
          style={{ backgroundColor: `${config.color}12`, color: config.color }}
        >
          {config.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13px] font-extrabold leading-tight sm:text-[15px]"
            style={{ color: config.color }}
          >
            {config.label}
          </div>
        </div>
      </button>

      <div className="flex flex-1 flex-col overflow-hidden px-3 pb-3 sm:px-5 sm:pb-4">
        {ordered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-100 bg-slate-50/45 text-[12px] font-medium text-slate-300 sm:text-[13px]">
            暂无待办
          </div>
        ) : (
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 scrollbar-hide sm:space-y-2">
            {visible.map((todo) => (
              <div
                key={todo.id}
                className="group cursor-pointer rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-50 sm:rounded-2xl sm:px-2 sm:py-1.5"
                onClick={() => onEdit(todo)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <motion.button
                    whileTap={{ scale: 0.86 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(todo.id);
                    }}
                    className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors sm:h-[20px] sm:w-[20px] sm:rounded-[6px] ${
                      todo.completed ? 'border-slate-200 bg-slate-200' : 'bg-white'
                    }`}
                    style={!todo.completed ? { borderColor: config.color } : {}}
                  >
                    {todo.completed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="-mt-0.5 h-1.5 w-2 rotate-[-45deg] border-b-[2px] border-l-[2px] border-white sm:w-2.5"
                      />
                    )}
                  </motion.button>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[12px] font-semibold leading-snug sm:text-[14px] ${
                        todo.completed ? 'text-[#C7C7CC] line-through' : 'text-slate-800'
                      }`}
                    >
                      {todo.title}
                    </span>
                    {todo.note && (
                      <MarkdownText
                        text={todo.note}
                        className={`mt-0.5 truncate text-[10px] sm:text-[11px] ${
                          todo.completed ? 'text-[#C7C7CC] line-through' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-1 shrink-0 text-center">
            <button
              type="button"
              onClick={() => onOpenDetail(quadrant)}
              className="text-[11px] text-slate-400 transition-colors hover:text-slate-600 sm:text-[12px]"
            >
              查看更多
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

function QuickAddTodoModal({
  onClose,
  onAdd,
  initialQuadrant = '重要且紧急',
}: {
  onClose: () => void;
  onAdd: (title: string, quadrant: QuadrantType, note?: string) => void;
  initialQuadrant?: QuadrantType;
}) {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoNote, setNewTodoNote] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType>(initialQuadrant);
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
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodoView({ todos, onAdd, onToggle, onEdit }: TodoViewProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddQuadrant, setQuickAddQuadrant] = useState<QuadrantType>('重要且紧急');
  const [detailQuadrant, setDetailQuadrant] = useState<QuadrantType | null>(null);
  const filteredTodos = useMemo(() => todos.filter((todo) => !todo.isArchived), [todos]);

  const todosByQuadrant = useMemo(() => {
    const groups: Record<QuadrantType, Todo[]> = {
      重要且紧急: [],
      重要不紧急: [],
      不重要但紧急: [],
      不重要不紧急: [],
    };
    for (const todo of filteredTodos) {
      groups[todo.quadrant].push(todo);
    }
    return groups;
  }, [filteredTodos]);

  const openDetail = (quadrant: QuadrantType) => {
    setDetailQuadrant(quadrant);
  };

  const openQuickAdd = (quadrant?: QuadrantType) => {
    if (quadrant) setQuickAddQuadrant(quadrant);
    setIsQuickAddOpen(true);
  };

  useEffect(() => {
    if (detailQuadrant) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [detailQuadrant]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F6F8FB] pb-24 lg:pb-12">
      <PageHeader
        title="四象限待办"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => openQuickAdd()}
              className="hidden h-11 cursor-pointer items-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-sm font-extrabold text-white shadow-[0_12px_32px_-22px_rgba(15,23,42,0.6)] transition-colors hover:bg-slate-800 sm:flex"
            >
              <Plus size={16} />
              新建待办
            </button>
            <button
              type="button"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-white/60 sm:hidden"
              aria-label="更多"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        }
      />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:py-5">
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4">
          {quadrants.map((quadrant) => (
            <QuadrantCard
              key={quadrant}
              quadrant={quadrant}
              todos={todosByQuadrant[quadrant]}
              onToggle={onToggle}
              onEdit={onEdit}
              onOpenDetail={openDetail}
            />
          ))}
        </div>
      </main>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_18px_36px_-12px_rgba(59,130,246,0.6)] sm:hidden"
        onClick={() => openQuickAdd()}
        aria-label="新建待办"
      >
        <Plus size={26} strokeWidth={2.4} />
      </motion.button>

      {detailQuadrant && (
        <QuadrantDetailView
          quadrant={detailQuadrant}
          todos={todosByQuadrant[detailQuadrant]}
          onClose={() => setDetailQuadrant(null)}
          onToggle={onToggle}
          onEdit={onEdit}
          onAdd={() => openQuickAdd(detailQuadrant)}
        />
      )}

      {isQuickAddOpen && (
        <QuickAddTodoModal
          onClose={() => setIsQuickAddOpen(false)}
          onAdd={onAdd}
          initialQuadrant={quickAddQuadrant}
        />
      )}
    </div>
  );
}
