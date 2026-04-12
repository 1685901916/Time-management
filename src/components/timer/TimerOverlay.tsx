import { motion } from 'motion/react';
import { X, Square } from 'lucide-react';
import type { Goal } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface TimerOverlayProps {
  timer: { startTime: number; goal: Goal };
  note: string;
  elapsed: string;
  onNoteChange: (note: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export default function TimerOverlay({ timer, note, elapsed, onNoteChange, onFinish, onCancel }: TimerOverlayProps) {
  const color = CATEGORY_COLORS[timer.goal.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-white"
    >
      {/* Compact top bar with timer info */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ backgroundColor: color + '15' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-800">{timer.goal.title}</span>
            <span className="text-xs text-gray-400 ml-2">{timer.goal.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold" style={{ color }}>{elapsed}</span>
          <button onClick={onCancel} className="p-1.5 bg-gray-100 rounded-full"><X size={18} className="text-gray-500" /></button>
        </div>
      </div>

      {/* Large writing area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="在这里记录你的想法、笔记、心得...

支持自由书写，计时结束后会自动保存到时间记录中。"
          className="flex-1 w-full px-5 py-4 outline-none resize-none text-[16px] text-gray-700 leading-relaxed placeholder-gray-300"
          autoFocus
        />
      </div>

      {/* Bottom actions */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 font-medium active:scale-[0.98] transition-transform">
          取消
        </button>
        <button onClick={onFinish} className="flex-1 py-3 rounded-2xl text-white font-bold active:scale-[0.98] transition-transform shadow-md"
          style={{ backgroundColor: color }}>
          <Square size={14} className="inline mr-1.5 fill-current" />完成记录
        </button>
      </div>
    </motion.div>
  );
}
