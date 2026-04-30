import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronLeft, MoreVertical, Plus } from 'lucide-react';
import type { QuadrantType, Todo } from '../../types';
import { QUADRANT_CONFIG } from '../../constants';
import MarkdownText from '../common/MarkdownText';

interface QuadrantDetailViewProps {
  quadrant: QuadrantType;
  todos: Todo[];
  onClose: () => void;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onAdd: () => void;
}

function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[14px] font-bold text-slate-400">{title}</span>
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
          {count}
          <ChevronDown
            size={14}
            className={`transition-transform ${open ? '' : '-rotate-90'}`}
          />
        </span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </section>
  );
}

function TodoRow({
  todo,
  onToggle,
  onEdit,
  accentColor,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  accentColor: string;
}) {
  return (
    <div
      onClick={() => onEdit(todo)}
      className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-b-0"
    >
      <motion.button
        whileTap={{ scale: 0.86 }}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(todo.id);
        }}
        className={`mt-0.5 flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors ${
          todo.completed ? 'border-slate-200 bg-slate-200' : 'bg-white'
        }`}
        style={!todo.completed ? { borderColor: accentColor } : undefined}
      >
        {todo.completed && (
          <div className="-mt-0.5 h-1.5 w-2.5 rotate-[-45deg] border-b-[2px] border-l-[2px] border-white" />
        )}
      </motion.button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-[15px] font-semibold leading-snug ${
              todo.completed ? 'text-[#C7C7CC] line-through' : 'text-slate-800'
            }`}
          >
            {todo.title}
          </span>
        </div>
        {todo.note && (
          <MarkdownText
            text={todo.note}
            className={`mt-1 truncate text-[12px] ${
              todo.completed ? 'text-[#C7C7CC] line-through' : 'text-slate-400'
            }`}
          />
        )}
        {todo.date && (
          <p className={`mt-1 text-[11px] font-medium ${todo.completed ? 'text-[#C7C7CC]' : 'text-slate-400'}`}>
            {todo.date}
          </p>
        )}
      </div>

      <span className="shrink-0 self-end pb-0.5 text-[11px] font-medium text-slate-300">
        收集箱
      </span>
    </div>
  );
}

export default function QuadrantDetailView({
  quadrant,
  todos,
  onClose,
  onToggle,
  onEdit,
  onAdd,
}: QuadrantDetailViewProps) {
  const config = QUADRANT_CONFIG[quadrant];

  const groups = useMemo(() => {
    const undone = todos.filter((todo) => !todo.completed);
    const done = todos.filter((todo) => todo.completed);
    return { undone, done };
  }, [todos]);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#F6F8FB]">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            aria-label="返回"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-[18px] font-extrabold text-slate-900" style={{ color: config.color }}>
            {config.label}
          </h1>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="更多"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <Section title="没有日期" count={groups.undone.length} defaultOpen>
          {groups.undone.length === 0 ? (
            <div className="py-6 text-center text-[13px] font-medium text-slate-300">
              这个象限暂时没有未完成的待办
            </div>
          ) : (
            groups.undone.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                accentColor={config.color}
              />
            ))
          )}
        </Section>

        {groups.done.length > 0 && (
          <Section title="已完成" count={groups.done.length} defaultOpen={false}>
            {groups.done.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                accentColor={config.color}
              />
            ))}
          </Section>
        )}
      </main>

      <button
        type="button"
        onClick={onAdd}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_18px_36px_-12px_rgba(59,130,246,0.6)]"
        aria-label="新建待办"
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>
    </div>
  );
}
