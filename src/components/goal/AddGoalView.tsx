import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { Category, CategoryType, Goal } from '../../types';
import { CATEGORY_COLORS, EDITABLE_CATEGORY_VALUES, GOAL_COLOR_PRESETS } from '../../constants';

interface AddGoalViewProps {
  onSave: (goal: Goal) => void;
  onCancel: () => void;
  categories: Category[];
  onCreateCategory: (data: { name: string; color: string }) => Promise<Category | null>;
}

export default function AddGoalView({ onSave, onCancel, categories, onCreateCategory }: AddGoalViewProps) {
  const [title, setTitle] = useState('');
  const categoryOptions = categories.length > 0 ? categories : EDITABLE_CATEGORY_VALUES.map((name) => ({ id: name, name, color: CATEGORY_COLORS[name] }));
  const [category, setCategory] = useState<string>(categoryOptions[0]?.name || EDITABLE_CATEGORY_VALUES[0]);
  const [color, setColor] = useState(categoryOptions[0]?.color || CATEGORY_COLORS[EDITABLE_CATEGORY_VALUES[0]]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

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

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || savingCategory) return;
    setSavingCategory(true);
    try {
      const created = await onCreateCategory({ name, color });
      if (created) {
        setCategory(created.name);
        setColor(created.color);
        setNewCategoryName('');
      }
    } finally {
      setSavingCategory(false);
    }
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
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === 'Enter') handleSave();
            }}
            className="w-full text-lg font-medium outline-none border-b-2 border-gray-100 focus:border-[#6DADD1] pb-2 transition-colors"
            autoFocus
          />

          <div>
            <p className="text-xs text-gray-400 mb-3">分类</p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setCategory(cat.name);
                    const currentCategoryColor = categoryOptions.find((item) => item.name === category)?.color || CATEGORY_COLORS[category as CategoryType];
                    if (color === currentCategoryColor) {
                      setColor(cat.color);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === cat.name ? 'border-[#6DADD1] bg-[#EAF4FB] text-[#3A7CA5]' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                  if (event.key === 'Enter') handleCreateCategory();
                }}
                placeholder="新分类名称"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6DADD1] focus:ring-2 focus:ring-blue-50"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || savingCategory}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                新建
              </button>
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
