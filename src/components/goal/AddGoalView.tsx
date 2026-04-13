import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { CategoryType, Goal } from '../../types';
import { CATEGORY_COLORS, GOAL_COLOR_PRESETS } from '../../constants';

interface AddGoalViewProps {
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

const categories = Object.keys(CATEGORY_COLORS) as CategoryType[];

export default function AddGoalView({ onSave, onCancel }: AddGoalViewProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>(categories[0]);
  const [color, setColor] = useState(CATEGORY_COLORS[categories[0]]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: '',
      title: title.trim(),
      subtitle: '',
      category,
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="relative bg-white rounded-t-3xl z-10"
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <span className="text-lg font-bold text-gray-800">添加计时目标</span>
          <button onClick={onCancel} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <input
            type="text"
            placeholder="目标名称，例如：每天学习 2 小时"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full text-lg font-medium outline-none border-b-2 border-gray-100 focus:border-[#6DADD1] pb-2 transition-colors"
            autoFocus
          />

          <div>
            <p className="text-xs text-gray-400 mb-3">分类</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    if (color === CATEGORY_COLORS[category]) {
                      setColor(CATEGORY_COLORS[cat]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === cat ? 'border-[#6DADD1] bg-[#EAF4FB] text-[#3A7CA5]' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-3">主题颜色</p>
            <div className="grid grid-cols-6 gap-3">
              {GOAL_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setColor(preset)}
                  className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                    color === preset ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-90'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                >
                  {color === preset && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-3.5 rounded-2xl text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
            style={{ backgroundColor: color }}
          >
            添加并开始计时
          </button>
        </div>
      </motion.div>
    </div>
  );
}
