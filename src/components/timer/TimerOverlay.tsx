import { motion } from 'motion/react';
import { Trash2, X, Square, Timer, NotebookPen } from 'lucide-react';
import { memo } from 'react';
import type { Goal } from '../../types';
import { getCategoryColor } from '../../constants';

interface TimerOverlayProps {
  timer: { startTime: number; goal: Goal };
  note: string;
  elapsed: string;
  onNoteChange: (note: string) => void;
  onFinish: () => void;
  onCancel: () => void;
  onDiscard: () => void;
  finishing?: boolean;
  categoryColorMap?: Record<string, string>;
}

const NoteEditor = memo(function NoteEditor({
  note,
  onNoteChange,
}: {
  note: string;
  onNoteChange: (note: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60 p-4 sm:p-6">
      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder={'在这里随手记录你的想法、笔记和过程，支持 Markdown 格式。\n\n计时结束后，这些内容会自动保存到对应的时间记录里。'}
        className="min-h-[280px] flex-1 w-full resize-none rounded-2xl border border-slate-100 bg-white/85 p-4 text-[15px] leading-7 text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none placeholder:text-slate-300 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 sm:p-5"
        autoFocus
      />
    </div>
  );
});

export default function TimerOverlay({
  timer,
  note,
  elapsed,
  onNoteChange,
  onFinish,
  onCancel,
  onDiscard,
  finishing = false,
  categoryColorMap = {},
}: TimerOverlayProps) {
  const category = timer.goal.category;
  const color = timer.goal.color || getCategoryColor(category, categoryColorMap);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end bg-slate-950/35 p-0 sm:items-center sm:justify-center sm:p-6"
    >
      <motion.div
        initial={{ y: 24, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'tween', duration: 0.18 }}
        className="flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[720px] sm:max-w-5xl sm:rounded-2xl"
      >
        <div
          className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"
          style={{ backgroundColor: `${color}12` }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
              <div className="h-4 w-4 rounded-full bg-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-bold text-slate-900">{timer.goal.title}</span>
                <span className="shrink-0 text-xs font-medium text-slate-400">{category}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">记录过程，完成后自动保存到时间线</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold sm:text-xl" style={{ color }}>
              {elapsed}
            </span>
            <button onClick={onCancel} className="cursor-pointer rounded-full bg-slate-100 p-2 transition-colors hover:bg-slate-200" aria-label="关闭计时笔记">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 sm:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden border-r border-slate-100 bg-slate-50/70 p-6 sm:block">
            <div className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Timer size={17} />
                专注中
              </div>
              <div className="mt-5 font-mono text-4xl font-bold" style={{ color }}>
                {elapsed}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                当前目标：{timer.goal.subtitle || timer.goal.title}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <NotebookPen size={17} />
                笔记建议
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">只记录关键想法、阻塞点、下一步即可，避免把笔记区变成全文档编辑器。</p>
            </div>
          </aside>

          <div className="flex min-h-[420px] flex-col sm:min-h-[560px]">
            <NoteEditor note={note} onNoteChange={onNoteChange} />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-slate-200 py-3 font-semibold text-slate-500 transition-colors hover:bg-slate-50"
          >
            关闭
          </button>
          <button
            onClick={onDiscard}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            <Trash2 size={14} />
            取消计时
          </button>
          <button
            onClick={onFinish}
            disabled={finishing}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <Square size={14} className="fill-current" />
            {finishing ? '保存中' : '完成记录'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
