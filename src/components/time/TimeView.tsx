import React, { useMemo, useState } from 'react';
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

const minutesToTime = (minutes: number) =>
  `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;

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
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const result: TimelineItem[] = [];
    let lastEndTime = '00:00';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let maxEntryEnd = 0;

    items.forEach((entry) => {
      maxEntryEnd = Math.max(maxEntryEnd, timeToMinutes(entry.endTime));
    });

    const endMinutes = isToday ? Math.max(currentMinutes, maxEntryEnd) : 24 * 60;

    items.forEach((entry) => {
      const entryStart = timeToMinutes(entry.startTime);
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
      if (timeToMinutes(entry.endTime) > lastEnd) {
        lastEndTime = entry.endTime;
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

      <div className="bg-white px-4 py-2 flex items-center justify-end border-b border-gray-50">
        <button
          onClick={() => onTabChange('analysis')}
          className="flex items-center gap-2 text-sm text-[#6DADD1] active:opacity-70"
        >
          <BookOpen size={14} />
          打开复盘与总结
        </button>
      </div>

      <div className="bg-white relative">
        <TimeCircle
          entries={entries}
          onSelectEntry={handleCircleSelect}
          selectedEntryId={selectedEntry?.id}
          isToday={isToday}
        />
        {activeTimer && isToday && (
          <button
            onClick={onTimerClick}
            className="absolute top-4 right-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-white shadow-[0_0_12px_rgba(250,204,21,0.5)]"
          >
            {activeTimer.goal.category} · {elapsed}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {activeTimer && isToday && (
          <button
            onClick={onTimerClick}
            className="flex w-full items-center justify-between border-b border-yellow-100 bg-yellow-50 px-4 py-3 text-left active:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-mono text-yellow-600">进行中</span>
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[normalizeCategory(activeTimer.goal.category)] }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-yellow-700">{activeTimer.goal.category}</span>
                  <span className="text-xs font-mono text-yellow-600">{elapsed}</span>
                </div>
                <p className="mt-0.5 text-xs text-yellow-500">正在记录：{activeTimer.goal.title}</p>
              </div>
            </div>
          </button>
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
              <div
                key={item.id}
                ref={(element) => {
                  if (item.itemType === 'entry') timelineRefs.current[item.id] = element;
                }}
                onClick={() => {
                  if (item.itemType === 'entry') {
                    onQuickNote(item);
                  } else {
                    onAddEntry({ startTime: item.startTime, endTime: item.endTime });
                  }
                }}
                className={`cursor-pointer border-b border-gray-50 px-4 py-3 transition-colors active:bg-gray-50 ${
                  selectedEntry?.id === item.id ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-[88px] shrink-0 pt-0.5 text-right">
                    <p className="text-xs font-mono text-gray-500">{timeLabel}</p>
                    <p className="mt-1 text-[11px] text-gray-300">{durationLabel}</p>
                  </div>

                  <div className="relative flex w-4 shrink-0 justify-center">
                    <div className="absolute inset-y-0 w-px bg-gray-100" />
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full z-10" style={{ backgroundColor: color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.itemType === 'gap' ? 'text-gray-400' : 'font-medium text-gray-700'}`}>
                        {item.category}
                      </span>
                      {item.itemType === 'entry' && getPhotoCount(item) > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Camera size={10} />
                          {getPhotoCount(item)}
                        </span>
                      )}
                    </div>

                    {item.itemType === 'entry' && item.note && (
                      <p className="mt-1 text-sm leading-relaxed text-gray-500 line-clamp-2">{item.note}</p>
                    )}

                    {item.itemType === 'entry' && (item.linkedTodoId || item.linkedGoalId) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.linkedTodoId &&
                          (() => {
                            const todo = todos.find((currentTodo) => currentTodo.id === item.linkedTodoId);
                            return todo ? (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] text-blue-500 bg-blue-50">
                                <CheckSquare size={8} />
                                {todo.title}
                              </span>
                            ) : null;
                          })()}

                        {item.linkedGoalId &&
                          (() => {
                            const goal = goals.find((currentGoal) => currentGoal.id === item.linkedGoalId);
                            return goal ? (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] text-amber-500 bg-amber-50">
                                <Target size={8} />
                                {goal.title}
                              </span>
                            ) : null;
                          })()}
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    {item.itemType === 'entry' && <ChevronRightSmall size={14} className="text-gray-300" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {uncompletedTodos.length > 0 && isToday && (
        <div className="mt-4 px-4">
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
