import { useMemo, useRef, useState } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { Check, GripVertical, Plus, Sparkles, Trash2, X } from 'lucide-react';
import Header from '../common/Header';
import type { CategoryType, Goal } from '../../types';
import { CATEGORY_COLORS, GOAL_COLOR_PRESETS, normalizeCategory } from '../../constants';

interface GoalsViewProps {
  goals: Goal[];
  onStart: (goal: Goal) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { title?: string; subtitle?: string; category?: string; color?: string; sortOrder?: number }) => void;
  onReorder: (goalIds: string[]) => void;
  onMoreClick: () => void;
}

const LONG_PRESS_MS = 260;
const categories = Object.keys(CATEGORY_COLORS).filter((item) => item !== '未记录') as CategoryType[];

function SortableGoalCard({
  goal,
  onStart,
  onOpenEdit,
}: {
  goal: Goal;
  onStart: (goal: Goal) => void;
  onOpenEdit: (goal: Goal) => void;
}) {
  const controls = useDragControls();
  const timerRef = useRef<number | null>(null);
  const [dragReady, setDragReady] = useState(false);

  const clearPressTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    clearPressTimer();
    setDragReady(false);
    timerRef.current = window.setTimeout(() => {
      setDragReady(true);
      controls.start(event);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    clearPressTimer();
    window.setTimeout(() => setDragReady(false), 120);
  };

  return (
    <Reorder.Item
      value={goal}
      dragListener={false}
      dragControls={controls}
      className="flex items-center justify-between rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: goal.color || CATEGORY_COLORS[normalizeCategory(goal.category)] }}
    >
      <div className="min-w-0 flex-1 cursor-pointer text-white" onClick={() => onOpenEdit(goal)}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`mt-0.5 rounded-full p-1.5 transition-colors ${dragReady ? 'bg-white/25' : 'bg-white/10'}`}
            aria-label="长按拖动排序"
          >
            <GripVertical size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold">{goal.title}</h3>
            {goal.subtitle && <p className="mt-1 truncate text-sm text-white/80">{goal.subtitle}</p>}
            <p className="mt-1.5 text-xs text-white/70">长按左侧手柄可拖动排序</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onStart(goal)}
        className="ml-3 shrink-0 rounded-full bg-white/20 px-4 py-1.5 text-base font-medium text-white transition-colors hover:bg-white/30"
      >
        开始
      </button>
    </Reorder.Item>
  );
}

export default function GoalsView({ goals, onStart, onAdd, onDelete, onUpdate, onReorder, onMoreClick }: GoalsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>(categories[0]);
  const [editColor, setEditColor] = useState(CATEGORY_COLORS[categories[0]]);
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>([]);

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)),
    [goals]
  );

  const visibleGoals = orderedGoals.length === sortedGoals.length ? orderedGoals : sortedGoals;

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(normalizeCategory(goal.category));
    setEditColor(goal.color || CATEGORY_COLORS[normalizeCategory(goal.category)]);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    onUpdate(editingId, { title: editTitle.trim(), category: editCategory, color: editColor });
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
        rightIcons={
          <button onClick={onAdd}>
            <Plus size={24} />
          </button>
        }
      />

      <div className="px-4 pt-3 pb-2">
        <p className="text-xs text-gray-400">
          长按目标左侧手柄可调整顺序，顶部目标会优先显示，也更方便直接开始计时。
        </p>
      </div>

      <Reorder.Group axis="y" values={visibleGoals} onReorder={setOrderedGoals} className="grid grid-cols-1 gap-3 p-4">
        {visibleGoals.map((goal) => (
          <SortableGoalCard key={goal.id} goal={goal} onStart={onStart} onOpenEdit={openEdit} />
        ))}
      </Reorder.Group>

      {orderedGoals.length > 0 && (
        <div className="-mt-1 mb-3 px-4">
          <button
            className="w-full rounded-2xl bg-[#EEF5FA] py-2.5 text-sm font-medium text-[#3A7CA5]"
            onClick={() => onReorder(orderedGoals.map((goal) => goal.id))}
          >
            保存当前排序
          </button>
        </div>
      )}

      <div className="px-4">
        <button
          onClick={onAdd}
          className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-6 text-gray-400 transition-colors hover:bg-gray-50"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-medium">添加新目标</span>
        </button>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingId(null)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="relative z-10 rounded-t-3xl bg-white"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 pt-5 pb-3">
              <span className="text-lg font-bold text-gray-800">编辑目标</span>
              <button onClick={() => setEditingId(null)} className="rounded-full bg-gray-100 p-2">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <input
                type="text"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="目标名称"
                className="w-full border-b-2 border-gray-100 pb-2 text-lg font-medium outline-none transition-colors focus:border-[#6DADD1]"
                autoFocus
              />

              <div>
                <p className="mb-3 text-xs text-gray-400">分类</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setEditCategory(category)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        editCategory === category ? 'border-[#6DADD1] bg-[#EAF4FB] text-[#3A7CA5]' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs text-gray-400">主题颜色</p>
                <div className="grid grid-cols-6 gap-3">
                  {GOAL_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setEditColor(preset)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        editColor === preset ? 'scale-110 ring-2 ring-gray-400 ring-offset-2' : 'opacity-90'
                      }`}
                      style={{ backgroundColor: preset }}
                    >
                      {editColor === preset && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-red-200 px-5 py-3 font-medium text-red-500 transition-transform active:scale-[0.98]"
                >
                  <Trash2 size={16} />
                  删除
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="flex-1 rounded-2xl py-3 font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
                  style={{ backgroundColor: editColor }}
                >
                  <Check size={16} className="mr-1 inline" />
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
