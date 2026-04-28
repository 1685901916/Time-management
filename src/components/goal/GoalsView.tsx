import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { Check, GripVertical, Layers3, Play, Plus, Sparkles, Target, Trash2, X } from 'lucide-react';
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

const APP_COLORS = {
  page: '#F8FAFC',
  panel: '#FFFFFF',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  accent: '#0F766E',
  accentHover: '#115E59',
};

const goalDisplayColor = (goal: Goal) => CATEGORY_COLORS[normalizeCategory(goal.category)] || goal.color || APP_COLORS.accent;

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
  const category = normalizeCategory(goal.category);
  const color = goal.color || CATEGORY_COLORS[category];

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
      className="group flex items-center justify-between gap-3 rounded-2xl bg-[var(--goal-color)] p-4 text-white shadow-sm transition-shadow duration-200 hover:shadow-float lg:hidden"
      style={{ '--goal-color': color } as CSSProperties}
    >
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3 lg:w-full lg:flex-none">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`shrink-0 cursor-grab rounded-full p-1.5 transition-colors active:cursor-grabbing ${
            dragReady ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'
          }`}
          aria-label="长按拖动排序"
        >
          <GripVertical size={16} />
        </button>

        <button
          type="button"
          onClick={() => onOpenEdit(goal)}
          className="min-w-0 flex-1 cursor-pointer text-left"
          aria-label={`编辑目标 ${goal.title}`}
        >
          <div className="mb-1 inline-flex max-w-full items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white/90">
            <span className="truncate">{category}</span>
          </div>
          <h3 className="truncate text-lg font-bold leading-tight lg:text-xl">{goal.title}</h3>
          {goal.subtitle && <p className="mt-1 truncate text-sm leading-5 text-white/80">{goal.subtitle}</p>}
        </button>
      </div>

      <div className="mt-0 flex shrink-0 items-center justify-between gap-3 lg:mt-4 lg:w-full">
        <button
          onClick={() => onStart(goal)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label={`开始 ${goal.title}`}
        >
          <Play size={15} fill="currentColor" />
          开始
        </button>
      </div>
    </Reorder.Item>
  );
}

function DesktopGoalCard({
  goal,
  onStart,
  onOpenEdit,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  goal: Goal;
  onStart: (goal: Goal) => void;
  onOpenEdit: (goal: Goal) => void;
  onDragStart: (goalId: string) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (targetId: string) => void;
}) {
  const category = normalizeCategory(goal.category);
  const color = goalDisplayColor(goal);

  return (
    <article
      draggable
      onDragStart={() => onDragStart(goal.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(goal.id)}
      className="group flex min-h-[168px] cursor-grab flex-col justify-between rounded-2xl bg-[var(--goal-color)] p-5 text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-float active:cursor-grabbing"
      style={{ '--goal-color': color } as CSSProperties}
    >
      <div className="flex min-w-0 items-start gap-4">
        <button
          type="button"
          className="mt-1 cursor-grab rounded-full bg-white/16 p-1.5 text-white/85 transition-colors group-hover:bg-white/24"
          aria-label="拖动排序"
        >
          <GripVertical size={16} />
        </button>

        <button type="button" onClick={() => onOpenEdit(goal)} className="min-w-0 flex-1 cursor-pointer text-left">
          <h3 className="line-clamp-1 text-2xl font-bold leading-tight">{goal.title}</h3>
          <p className="mt-2 line-clamp-1 text-sm font-medium leading-5 text-white/86">{goal.subtitle || category}</p>
        </button>
      </div>

      <button
        onClick={() => onStart(goal)}
        className="mt-4 inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-end rounded-full bg-white/22 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/32 focus:outline-none focus:ring-2 focus:ring-white/70"
        aria-label={`开始 ${goal.title}`}
      >
        <Play size={15} fill="currentColor" />
        开始
      </button>
    </article>
  );
}

export default function GoalsView({ goals, onStart, onAdd, onDelete, onUpdate, onReorder, onMoreClick }: GoalsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>(categories[0]);
  const [editColor, setEditColor] = useState(CATEGORY_COLORS[categories[0]]);
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>([]);
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)),
    [goals]
  );

  const visibleGoals = orderedGoals.length === sortedGoals.length ? orderedGoals : sortedGoals;
  const categorySummaries = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          count: goals.filter((goal) => normalizeCategory(goal.category) === category).length,
          color: CATEGORY_COLORS[category],
        }))
        .filter((item) => item.count > 0),
    [goals]
  );

  const handleDesktopDrop = (targetId: string) => {
    if (!draggingGoalId || draggingGoalId === targetId) return;
    const current = [...visibleGoals];
    const fromIndex = current.findIndex((goal) => goal.id === draggingGoalId);
    const toIndex = current.findIndex((goal) => goal.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [dragged] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, dragged);
    setOrderedGoals(current);
    setDraggingGoalId(null);
  };

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
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-10">
      <div className="lg:hidden">
        <Header
          title="目标"
          leftIcon={<Sparkles size={22} />}
          onMoreClick={onMoreClick}
          rightIcons={
            <button onClick={onAdd} className="cursor-pointer" aria-label="添加目标">
              <Plus size={24} />
            </button>
          }
        />
      </div>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 lg:px-10 lg:py-8">
        <div className="mb-6 hidden items-center justify-between lg:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1 text-sm font-medium text-teal-700">
              <Sparkles size={15} />
              目标管理
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">目标空间</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onMoreClick}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              更多
            </button>
            <button
              onClick={onAdd}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[filter,transform] hover:brightness-95 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              <Plus size={18} />
              新建目标
            </button>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">目标总数</span>
                <Target size={18} className="text-teal-600" />
              </div>
              <div className="mt-3 text-4xl font-bold text-slate-950">{goals.length}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">桌面拖动卡片换位，手机长按手柄排序。</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Layers3 size={17} className="text-teal-600" />
                分类分布
              </div>
              <div className="space-y-3">
                {categorySummaries.length > 0 ? (
                  categorySummaries.map((item) => (
                    <div key={item.category} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{item.category}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">还没有目标，先创建一个常用目标。</p>
                )}
              </div>
            </div>

          </aside>

          <div>
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <div>
                <p className="text-sm text-slate-500">目标总数</p>
                <p className="text-2xl font-bold text-slate-900">{goals.length}</p>
              </div>
              <button
                onClick={onAdd}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Plus size={18} />
                新建
              </button>
            </div>

            <Reorder.Group
              axis="y"
              values={visibleGoals}
              onReorder={setOrderedGoals}
              className="grid grid-cols-1 gap-3 lg:hidden"
            >
              {visibleGoals.map((goal) => (
                <SortableGoalCard key={goal.id} goal={goal} onStart={onStart} onOpenEdit={openEdit} />
              ))}
            </Reorder.Group>

            <div className="hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3">
              {visibleGoals.map((goal) => (
                <DesktopGoalCard
                  key={goal.id}
                  goal={goal}
                  onStart={onStart}
                  onOpenEdit={openEdit}
                  onDragStart={setDraggingGoalId}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDesktopDrop}
                />
              ))}
            </div>

            {orderedGoals.length > 0 && (
              <div className="mt-4">
                <button
                  className="w-full cursor-pointer rounded-2xl bg-[#E9E3D6] py-2.5 text-sm font-semibold text-[#102033] transition-colors hover:bg-[#DED6C7] lg:rounded-xl"
                  onClick={() => onReorder(orderedGoals.map((goal) => goal.id))}
                >
                  保存当前排序
                </button>
              </div>
            )}

            <button
              onClick={onAdd}
              className="mt-4 flex min-h-[96px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/70 p-6 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 lg:rounded-2xl"
            >
              <Plus size={30} className="mb-2" />
              <span className="font-semibold">添加新目标</span>
            </button>
          </div>
        </section>
      </main>

      {editingId && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingId(null)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="relative z-10 w-full rounded-t-3xl bg-white shadow-2xl lg:max-w-lg lg:rounded-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-goal-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3 pt-5">
              <span id="edit-goal-title" className="text-lg font-bold text-slate-900">
                编辑目标
              </span>
              <button onClick={() => setEditingId(null)} className="cursor-pointer rounded-full bg-slate-100 p-2 transition-colors hover:bg-slate-200" aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div>
                <label htmlFor="goal-title" className="mb-2 block text-xs font-semibold text-slate-500">
                  目标名称
                </label>
                <input
                  id="goal-title"
                  type="text"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="目标名称"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base font-medium outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  autoFocus
                />
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold text-slate-500">分类</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setEditCategory(category)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        editCategory === category ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold text-slate-500">主题颜色</p>
                <div className="grid grid-cols-6 gap-3 sm:grid-cols-8">
                  {GOAL_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setEditColor(preset)}
                      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all ${
                        editColor === preset ? 'scale-105 ring-2 ring-slate-400 ring-offset-2' : 'opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset }}
                      aria-label={`选择颜色 ${preset}`}
                    >
                      {editColor === preset && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 px-5 py-3 font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  删除
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-3 font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: editColor }}
                >
                  <Check size={16} />
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
