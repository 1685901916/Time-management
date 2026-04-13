import { motion } from 'motion/react';
import { X, Square } from 'lucide-react';
import type { Goal } from '../../types';
import { CATEGORY_COLORS, normalizeCategory } from '../../constants';

interface TimerOverlayProps {
  timer: { startTime: number; goal: Goal };
  note: string;
  elapsed: string;
  onNoteChange: (note: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export default function TimerOverlay({
  timer,
  note,
  elapsed,
  onNoteChange,
  onFinish,
  onCancel,
}: TimerOverlayProps) {
  const category = normalizeCategory(timer.goal.category);
  const color = CATEGORY_COLORS[category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-white"
    >
      <div
        className="flex items-center justify-between border-b border-gray-100 px-5 py-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
            <div className="h-4 w-4 rounded-full bg-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-800">{timer.goal.title}</span>
            <span className="ml-2 text-xs text-gray-400">{category}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold" style={{ color }}>
            {elapsed}
          </span>
          <button onClick={onCancel} className="rounded-full bg-gray-100 p-1.5">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={'在这里随手记录你的想法、笔记和过程。\n\n计时结束后，这些内容会自动保存到对应的时间记录里。'}
          className="flex-1 w-full resize-none px-5 py-4 text-[16px] leading-relaxed text-gray-700 outline-none placeholder:text-gray-300"
          autoFocus
        />
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-gray-200 py-3 font-medium text-gray-500 transition-transform active:scale-[0.98]"
        >
          取消
        </button>
        <button
          onClick={onFinish}
          className="flex-1 rounded-2xl py-3 font-bold text-white shadow-md transition-transform active:scale-[0.98]"
          style={{ backgroundColor: color }}
        >
          <Square size={14} className="mr-1.5 inline fill-current" />
          完成记录
        </button>
      </div>
    </motion.div>
  );
}
