import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Camera,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Target,
} from 'lucide-react';
import PageHeader from '../common/PageHeader';
import MarkdownText from '../common/MarkdownText';
import TimeCircle from './TimeCircle';
import type { Goal, TimeEntry, Todo } from '../../types';
import { CATEGORY_COLORS, getCategoryColor, getLocalDateString } from '../../constants';

interface TimeViewProps {
  entries: TimeEntry[];
  todos: Todo[];
  goals: Goal[];
  activeTimer: any;
  selectedDate: string;
  isToday: boolean;
  onDateChange: (date: string) => void;
  onDateClick: () => void;
  onEdit: (entry: TimeEntry) => void;
  onEditTime?: (entry: TimeEntry) => void;
  onAddEntry: (initialData: Partial<TimeEntry>) => void;
  onMoreClick: () => void;
  onTimerClick: () => void;
  onQuickNote: (entry: TimeEntry) => void;
  onTabChange: (tab: string) => void;
  elapsed: string;
  categoryColorMap?: Record<string, string>;
  goalColorMap?: Record<string, string>;
}

type TimelineGapItem = {
  id: string;
  itemType: 'gap';
  startTime: string;
  endTime: string;
  category: '未记录';
  durationMinutes: number;
};

type TimelineEntryItem = TimeEntry & { itemType: 'entry' };
type TimelineItem = TimelineGapItem | TimelineEntryItem;

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const getEntryTimelineRange = (entry: Pick<TimeEntry, 'startTime' | 'endTime'>) => {
  const start = timeToMinutes(entry.startTime);
  const end = timeToMinutes(entry.endTime);

  if (start > end) {
    return { start: start - 24 * 60, end };
  }

  return { start, end };
};

const minutesToTime = (minutes: number) =>
  `${Math.floor(((minutes % (24 * 60)) + 24 * 60) / 60 % 24).toString().padStart(2, '0')}:${(((minutes % 60) + 60) % 60).toString().padStart(2, '0')}`;

const formatDateLabel = (selectedDate: string, isToday: boolean) => {
  const [, m, d] = selectedDate.split('-').map(Number);
  if (isToday) return '今天';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (selectedDate === getLocalDateString(yesterday)) return '昨天';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (selectedDate === getLocalDateString(tomorrow)) return '明天';

  return `${m}月${d}日`;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
};

const formatTimelineStart = (item: TimelineItem) => {
  if (item.itemType === 'entry' && timeToMinutes(item.startTime) > timeToMinutes(item.endTime)) {
    return `前一天 ${item.startTime}`;
  }
  return item.startTime;
};

export default function TimeView({
  entries,
  todos,
  goals,
  activeTimer,
  selectedDate,
  isToday,
  onDateChange,
  onDateClick,
  onAddEntry,
  onTimerClick,
  onQuickNote,
  onEditTime,
  onTabChange,
  elapsed,
  categoryColorMap = {},
  goalColorMap = {},
}: TimeViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const timelineRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const timelineScrollRef = React.useRef<HTMLDivElement | null>(null);

  const displayDate = useMemo(() => formatDateLabel(selectedDate, isToday), [selectedDate, isToday]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items = [...entries]
      .map((entry) => ({ ...entry, itemType: 'entry' as const }))
      .sort((a, b) => getEntryTimelineRange(a).start - getEntryTimelineRange(b).start);

    const result: TimelineItem[] = [];
    let lastEndTime = '00:00';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const endMinutes = isToday ? currentMinutes : 24 * 60;

    items.forEach((entry) => {
      const range = getEntryTimelineRange(entry);
      const entryStart = range.start;
      const lastEnd = timeToMinutes(lastEndTime);

      if (entryStart > lastEnd) {
        const gapEnd = Math.min(entryStart, endMinutes);
        if (gapEnd > lastEnd) {
          result.push({
            id: `gap-${lastEnd}`,
            itemType: 'gap',
            startTime: minutesToTime(lastEnd),
            endTime: minutesToTime(gapEnd),
            category: '未记录',
            durationMinutes: gapEnd - lastEnd,
          });
        }
      }

      result.push(entry);
      if (range.end > lastEnd) {
        lastEndTime = minutesToTime(range.end);
      }
    });

    if (isToday && timeToMinutes(lastEndTime) < endMinutes) {
      result.push({
        id: `gap-${timeToMinutes(lastEndTime)}`,
        itemType: 'gap',
        startTime: lastEndTime,
        endTime: minutesToTime(endMinutes),
        category: '未记录',
        durationMinutes: endMinutes - timeToMinutes(lastEndTime),
      });
    }

    return result;
  }, [entries, isToday]);

  const uncompletedTodos = useMemo(
    () => todos.filter((todo) => !todo.completed && !todo.isArchived),
    [todos]
  );

  const handleCircleSelect = (entry: TimeEntry | null) => {
    setSelectedEntry(entry);
    if (entry && timelineRefs.current[entry.id] && timelineScrollRef.current) {
      const target = timelineRefs.current[entry.id]!;
      const container = timelineScrollRef.current;
      const targetTop = target.offsetTop - container.offsetTop - 24;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    onDateChange(getLocalDateString(new Date(y, m - 1, d - 1)));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    onDateChange(getLocalDateString(new Date(y, m - 1, d + 1)));
  };

  const getPhotoCount = (entry: TimeEntry) => entry.photos?.length || 0;
  const getEntryColor = (entry: TimeEntry) =>
    (entry.linkedGoalId && goalColorMap[entry.linkedGoalId]) || getCategoryColor(entry.category, categoryColorMap);
  const activeTimerColor = activeTimer?.goal?.color || getCategoryColor(activeTimer?.goal?.category, categoryColorMap);

  const dateStepper = (
    <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)]">
      <button
        onClick={handlePrevDay}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-950"
        aria-label="前一天"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={onDateClick}
        className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50"
      >
        <span className="text-sm font-extrabold text-slate-950">{displayDate}</span>
        <span className="hidden text-xs font-bold text-slate-400 sm:block">{selectedDate}</span>
      </button>
      <button
        onClick={handleNextDay}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-950"
        aria-label="后一天"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 lg:pb-12">
      <PageHeader
        title="今日记录"
        actions={
          <>
            {dateStepper}
            <button
              onClick={() => onTabChange('analysis')}
              className="hidden h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)] transition-colors hover:bg-slate-50 sm:flex"
            >
              <BookOpen size={16} />
              复盘
            </button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-5 lg:px-8">
        <button
          onClick={() => onTabChange('analysis')}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-sm font-extrabold text-slate-600 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)] sm:hidden"
        >
          <BookOpen size={14} />
          打开复盘与总结
        </button>

        <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="minimal-card relative flex items-center justify-center p-4 sm:p-5 xl:sticky xl:top-28 xl:self-start">
            <TimeCircle
              entries={entries}
              onSelectEntry={handleCircleSelect}
              selectedEntryId={selectedEntry?.id}
              isToday={isToday}
              categoryColorMap={categoryColorMap}
              goalColorMap={goalColorMap}
            />
            {activeTimer && isToday && (
              <button
                onClick={onTimerClick}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-[0_12px_32px_-22px_rgba(15,23,42,0.6)]"
                style={{
                  background: 'var(--color-accent-mint-fill)',
                  color: 'var(--color-accent-mint-ink)',
                }}
              >
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: 'var(--color-accent-mint-ring)' }}
                />
                {activeTimer.goal.category} · {elapsed}
              </button>
            )}
          </aside>

          <div ref={timelineScrollRef} className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {activeTimer && isToday && (
                <motion.button
                  layout
                  key="active-timer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={onTimerClick}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border bg-white p-4 text-left shadow-soft transition-transform active:scale-[0.99]"
                  style={{ borderColor: `${activeTimerColor}33` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl"
                      style={{
                        background: `${activeTimerColor}18`,
                        color: activeTimerColor,
                      }}
                    >
                      <span
                        className="mb-1 h-1.5 w-1.5 animate-pulse rounded-full"
                        style={{ background: activeTimerColor }}
                      />
                      <span className="number-font text-[10px] font-extrabold">{elapsed}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-950">
                          {activeTimer.goal.category}
                        </span>
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: activeTimerColor }}
                        />
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs font-bold text-slate-500">
                        {activeTimer.goal.title}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )}

              {timelineItems.length === 0 ? (
                <div className="rounded-2xl bg-white py-14 text-center shadow-[0_22px_60px_-52px_rgba(15,23,42,0.5)]">
                  <Clock size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">这一天还没有记录</p>
                  <button
                    onClick={() => onAddEntry({})}
                    className="suite-primary-button mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                  >
                    <Plus size={14} />
                    添加记录
                  </button>
                </div>
              ) : (
                timelineItems.map((item) => {
                  const color = item.itemType === 'entry' ? getEntryColor(item) : CATEGORY_COLORS.未记录;
                  const durationLabel = formatDuration(item.durationMinutes);
                  const isEntry = item.itemType === 'entry';

                  const handleTimeAreaClick = () => {
                    if (isEntry) {
                      if (onEditTime) onEditTime(item as TimeEntry);
                      else onAddEntry({ ...(item as TimeEntry) });
                    } else {
                      onAddEntry({ startTime: item.startTime, endTime: item.endTime });
                    }
                  };

                  const handleContentAreaClick = () => {
                    if (isEntry) {
                      onQuickNote(item as TimeEntry);
                    } else {
                      onAddEntry({ startTime: item.startTime, endTime: item.endTime });
                    }
                  };

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id}
                      ref={(element: HTMLDivElement | null) => {
                        if (item.itemType === 'entry') timelineRefs.current[item.id] = element;
                      }}
                      className={`rounded-2xl transition-all ${
                        item.itemType === 'gap'
                          ? 'border border-dashed border-slate-200 bg-white/60'
                          : 'border border-slate-100 bg-white shadow-[0_12px_32px_-30px_rgba(15,23,42,0.45)] hover:shadow-soft'
                      } ${selectedEntry?.id === item.id ? 'ring-2' : ''}`}
                      style={selectedEntry?.id === item.id ? { boxShadow: '0 0 0 2px var(--color-accent-mint-ring)' } : undefined}
                    >
                      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-stretch sm:grid-cols-[120px_minmax(0,1fr)]">
                        <button
                          type="button"
                          onClick={handleTimeAreaClick}
                          className="flex shrink-0 cursor-pointer flex-col items-start gap-1 rounded-l-2xl px-3 py-3 text-left transition-colors hover:bg-slate-50 active:scale-[0.99] sm:px-4 sm:py-3.5"
                          aria-label="编辑时间"
                        >
                          <p className="number-font text-[14px] font-extrabold text-slate-950 sm:text-[15px]">{formatTimelineStart(item)}</p>
                          <p className="number-font text-[14px] font-extrabold text-slate-950 sm:text-[15px]">{item.endTime}</p>
                          <p className="mt-1 inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600">{durationLabel}</p>
                        </button>

                        <button
                          type="button"
                          onClick={handleContentAreaClick}
                          className="relative min-w-0 cursor-pointer rounded-r-2xl border-l border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50/60 active:scale-[0.99] sm:py-3.5"
                          aria-label="编辑内容"
                        >
                          <span
                            className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full ring-4 ring-white"
                            style={{ backgroundColor: color }}
                          />
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`text-sm ${item.itemType === 'gap' ? 'font-bold text-slate-400' : 'font-extrabold text-slate-950'}`}>
                              {item.category}
                            </span>
                            {item.itemType === 'entry' && getPhotoCount(item) > 0 && (
                              <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                <Camera size={10} />
                                {getPhotoCount(item)}
                              </span>
                            )}
                          </div>

                          {item.itemType === 'entry' && item.note ? (
                            <MarkdownText text={item.note} className="line-clamp-2 text-[13px] font-bold leading-relaxed text-slate-600" />
                          ) : item.itemType === 'entry' ? (
                            <p className="mt-0.5 text-[12px] font-medium text-slate-300">点击添加备注...</p>
                          ) : null}

                          {item.itemType === 'entry' && (item.linkedTodoId || item.linkedGoalId) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {item.linkedTodoId &&
                                (() => {
                                  const todo = todos.find((currentTodo) => currentTodo.id === item.linkedTodoId);
                                  return todo ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                                      <CheckSquare size={10} />
                                      {todo.title}
                                    </span>
                                  ) : null;
                                })()}

                              {item.linkedGoalId &&
                                (() => {
                                  const goal = goals.find((currentGoal) => currentGoal.id === item.linkedGoalId);
                                  return goal ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                                      <Target size={10} />
                                      {goal.title}
                                    </span>
                                  ) : null;
                                })()}
                            </div>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </section>

        {uncompletedTodos.length > 0 && isToday && (
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-700">
                今日待办 <span className="text-slate-400">({uncompletedTodos.length})</span>
              </h3>
              <button
                onClick={() => onTabChange('todo')}
                className="text-xs font-extrabold"
                style={{ color: 'var(--color-accent-mint-ink)' }}
              >
                查看全部
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {uncompletedTodos.slice(0, 6).map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-[0_12px_32px_-30px_rgba(15,23,42,0.4)]"
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        todo.quadrant === '重要且紧急'
                          ? '#FF5C5C'
                          : todo.quadrant === '重要不紧急'
                            ? '#FFA726'
                            : todo.quadrant === '不重要但紧急'
                              ? '#42A5F5'
                              : '#2ECA8B',
                    }}
                  />
                  <span className="truncate text-sm font-bold text-slate-700">{todo.title}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
