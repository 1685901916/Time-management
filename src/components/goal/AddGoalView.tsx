import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { CategoryType, Goal } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface AddGoalViewProps {
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

const categories: CategoryType[] = [
  '睡觉', '学习', '运动', '刷手机', '休息', '信息工作', '户外', '写笔记', '游戏', '琐事'
];

export default function AddGoalView({ onSave, onCancel }: AddGoalViewProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('学习');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: '',
      title: title.trim(),
      subtitle: '',
      category,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <motion.div
        initial={{ y: "100%" }}
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
            placeholder="目标名称，如：每天学习3小时"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full text-lg font-medium outline-none border-b-2 border-gray-100 focus:border-[#6DADD1] pb-2 transition-colors"
            autoFocus
          />

          <div>
            <p className="text-xs text-gray-400 mb-3">选择主题颜色</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                    category === cat ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-80'
                  }`}
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  title={cat}
                >
                  {category === cat && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-3.5 rounded-2xl text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
          >
            添加并开始计时
          </button>
        </div>
      </motion.div>
    </div>
  );
}
