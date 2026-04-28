import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeftRight,
  BarChart2,
  BookOpen,
  Camera,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightSmall,
  Clock,
  Target,
} from 'lucide-react';
import Header from '../common/Header';
import MarkdownText from '../common/MarkdownText';
import TimeCircle from './TimeCircle';
import type { Goal, TimeEntry, Todo } from '../../types';
import { CATEGORY_COLORS, getLocalDateString, normalizeCategory } from '../../constants';

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
  onAddEntry: (initialData: Partial<TimeEntry>) => void;
  onMoreClick: () => void;
  onTimerClick: () => void;
  onQuickNote: (entry: TimeEntry) => void;
  onTabChange: (tab: string) => void;
  elapsed: string;
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
  const [y, m, d] = selectedDate.split('-').map(Number);
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
  onMoreClick,
  onTimerClick,
  onQuickNote,
  onTabChange,
  elapsed,
}: TimeViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const timelineRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const displayDate = useMemo(() => formatDateLabel(selectedDate, isToday), [selectedDate, isToday]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items = [...entries]
      .map((entry) => ({ ...entry, itemType: 'entry' as const }))
      .sort((a, b) => getEntryTimelineRange(a).start - getEntryTimelineRange(b).start);

    const result: TimelineItem[] = [];
    let lastEndTime = '00:00';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let maxEntryEnd = 0;

    items.forEach((entry) => {
      maxEntryEnd = Math.max(maxEntryEnd, getEntryTimelineRange(entry).end);
    });

    const endMinutes = isToday ? Math.max(currentMinutes, maxEntryEnd) : 24 * 60;

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

    if (timeToMinutes(lastEndTime) < endMinutes) {
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
    if (entry && timelineRefs.current[entry.id]) {
      timelineRefs.current[entry.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <div className="pb-20">
      <Header
        title={
          <div className="flex items-center gap-2">
            <button onClick={handlePrevDay} className="p-1 active:scale-90 transition-transform">
              <ChevronLeft size={20} />
            </button>
            <span onClick={onDateClick} className="min-w-[68px] cursor-pointer text-center font-medium">
              {displayDate}
            </span>
            <button onClick={handleNextDay} className="p-1 active:scale-90 transition-transform">
              <ChevronRight size={20} />
            </button>
          </div>
        }
        leftIcon={<ArrowLeftRight size={22} />}
        onMoreClick={onMoreClick}
        rightIcons={<BarChart2 size={22} />}
      />

      <div className="flex items-center justify-end border-b border-gray-50 bg-white px-4 py-2">
        <button
          onClick={() => onTabChange('analysis')}
          className="flex items-center gap-2 text-sm text-[#6DADD1] active:opacity-70"
        >
          <BookOpen size={14} />
          打开复盘与总结
        </button>
      </div>

      <div className="relative bg-white lg:flex lg:justify-center lg:py-4">
        <TimeCircle
          entries={entries}
          onSelectEntry={handleCircleSelect}
          selectedEntryId={selectedEntry?.id}
          isToday={isToday}
        />
        {activeTimer && isToday && (
          <button
            onClick={onTimerClick}
            className="absolute right-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-white shadow-[0_0_12px_rgba(250,204,21,0.5)]"
          >
            {activeTimer.goal.category} · {elapsed}
          </button>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-5xl space-y-2.5 px-4 lg:px-6">
        <AnimatePresence mode="popLayout">
        {activeTimer && isToday && (
          <motion.button
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onTimerClick}
            className="flex w-full items-center justify-between rounded-2xl border border-indigo-100 bg-white p-4 text-left shadow-soft transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mb-1" />
                 <span className="text-[10px] font-medium font-mono">{elapsed}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{activeTimer.goal.category}</span>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[normalizeCategory(activeTimer.goal.category)] }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{activeTimer.goal.title}</p>
              </div>
            </div>
          </motion.button>
        )}

        {timelineItems.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Clock size={48} className="mx-auto mb-2 opacity-10" />
            <p>这一天还没有记录</p>
          </div>
        ) : (
          timelineItems.map((item) => {
            const color = item.itemType === 'entry' ? CATEGORY_COLORS[normalizeCategory(item.category)] : CATEGORY_COLORS.未记录;
            const timeLabel = `${item.startTime} - ${item.endTime}`;
            const durationLabel = formatDuration(item.durationMinutes);

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                ref={(element: HTMLDivElement | null) => {
                  if (item.itemType === 'entry') timelineRefs.current[item.id] = element;
                }}
                onClick={() => {
                  if (item.itemType === 'entry') {
                    onQuickNote(item);
                  } else {
                    onAddEntry({ startTime: item.startTime, endTime: item.endTime });
                  }
                }}
                className={`cursor-pointer rounded-2xl px-4 py-3 transition-all active:scale-[0.98] lg:px-5 ${
                  item.itemType === 'gap' ? 'border border-dashed border-slate-100 bg-white/55' : 'border border-slate-100 bg-white shadow-sm hover:shadow-soft'
                } ${selectedEntry?.id === item.id ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4 lg:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="shrink-0 pt-0.5">
                    <p className="font-mono text-[15px] font-bold text-slate-900">{formatTimelineStart(item)}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-700">{item.endTime}</p>
                    <p className="mt-2 inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{durationLabel}</p>
                  </div>

                  <div className="relative min-w-0 border-l border-slate-100 pl-4">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white" style={{ backgroundColor: color }} />
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`text-sm ${item.itemType === 'gap' ? 'text-slate-400' : 'font-medium text-slate-800'}`}>
                        {item.category}
                      </span>
                      {item.itemType === 'entry' && getPhotoCount(item) > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          <Camera size={10} />
                          {getPhotoCount(item)}
                        </span>
                      )}
                    </div>

                    {item.itemType === 'entry' && item.note && (
                      <MarkdownText text={item.note} className="line-clamp-2 text-sm leading-relaxed text-slate-500" />
                    )}

                    {item.itemType === 'entry' && (item.linkedTodoId || item.linkedGoalId) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.linkedTodoId &&
                          (() => {
                            const todo = todos.find((currentTodo) => currentTodo.id === item.linkedTodoId);
                            return todo ? (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100">
                                <CheckSquare size={10} />
                                {todo.title}
                              </span>
                            ) : null;
                          })()}

                        {item.linkedGoalId &&
                          (() => {
                            const goal = goals.find((currentGoal) => currentGoal.id === item.linkedGoalId);
                            return goal ? (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100">
                                <Target size={10} />
                                {goal.title}
                              </span>
                            ) : null;
                          })()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        </AnimatePresence>
      </div>

      {uncompletedTodos.length > 0 && isToday && (
        <div className="mx-auto mt-4 max-w-5xl px-4 lg:px-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-600">今日待办 ({uncompletedTodos.length})</h3>
            <button onClick={() => onTabChange('todo')} className="text-xs text-[#6DADD1]">
              查看全部
            </button>
          </div>

          <div className="space-y-2">
            {uncompletedTodos.slice(0, 3).map((todo) => (
              <div key={todo.id} className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                <div
                  className="h-2 w-2 rounded-full"
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
                <span className="truncate text-sm text-gray-700">{todo.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
