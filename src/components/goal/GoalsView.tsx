import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Sparkles, X, Check } from 'lucide-react';
import Header from '../common/Header';
import type { Goal, CategoryType } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface GoalsViewProps {
  goals: Goal[];
  onStart: (goal: Goal) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { title?: string; subtitle?: string; category?: string }) => void;
  onMoreClick: () => void;
}

const categories: CategoryType[] = ['睡觉', '学习', '运动', '刷手机', '休息', '信息工作', '户外', '写笔记', '游戏', '琐事'];

export default function GoalsView({ goals, onStart, onAdd, onDelete, onUpdate, onMoreClick }: GoalsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>('学习');

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(goal.category);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    onUpdate(editingId, { title: editTitle, category: editCategory });
    setEditingId(null);
  };

  const handleDelete = () => {
    if (!editingId) return;
    onDelete(editingId);
    setEditingId(null);
  };

  return (
    <div className="pb-20">
      <Header
        title="目标"
        leftIcon={<Sparkles size={22} />}
        onMoreClick={onMoreClick}
        rightIcons={<button onClick={onAdd}><Plus size={24} /></button>}
      />
      <div className="p-4 grid grid-cols-1 gap-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="rounded-2xl p-4 flex items-center justify-between shadow-sm"
            style={{ backgroundColor: CATEGORY_COLORS[goal.category] }}
          >
            <div className="text-white flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(goal)}>
              <h3 className="text-lg font-bold">{goal.title}</h3>
            </div>
            <button
              onClick={() => onStart(goal)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-lg font-medium transition-colors flex-shrink-0 ml-3"
            >
              开始
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-medium">添加新目标</span>
        </button>
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingId(null)} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="relative bg-white rounded-t-3xl z-10"
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
              <span className="text-lg font-bold text-gray-800">编辑目标</span>
              <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="目标名称"
                className="w-full text-lg font-medium outline-none border-b-2 border-gray-100 focus:border-[#6DADD1] pb-2 transition-colors"
                autoFocus
              />

              <div>
                <p className="text-xs text-gray-400 mb-3">选择主题颜色</p>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEditCategory(cat)}
                      className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                        editCategory === cat ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      title={cat}
                    >
                      {editCategory === cat && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl border border-red-200 text-red-500 font-medium active:scale-[0.98] transition-transform"
                >
                  <Trash2 size={16} />删除
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-2xl bg-[#6DADD1] text-white font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <Check size={16} className="inline mr-1" />保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
