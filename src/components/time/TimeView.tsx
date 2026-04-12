import React, { useState, useMemo } from 'react';
import { Clock, ChevronLeft, ChevronRight, BarChart2, BookOpen, X, ArrowLeftRight, Play, Plus, Camera, CheckSquare, Target } from 'lucide-react';
import Header from '../common/Header';
import TimeCircle from './TimeCircle';
import type { TimeEntry, Todo, Goal } from '../../types';
import { CATEGORY_COLORS, getLocalDateString } from '../../constants';

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

export default function TimeView({
  entries, todos, goals, activeTimer, selectedDate, isToday,
  onDateChange, onDateClick, onEdit, onAddEntry, onMoreClick, onTimerClick,
  onQuickNote, onTabChange, elapsed
}: TimeViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const timelineRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

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

  const displayDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (isToday) return '今天';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === getLocalDateString(yesterday)) return '昨天';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDate === getLocalDateString(tomorrow)) return '明天';
    return `${m}月${d}日`;
  }, [selectedDate, isToday]);

  const timeToMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
  const minutesToTime = (minutes: number) => `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;

  const timelineItems = useMemo(() => {
    const items: any[] = [...entries.map(e => ({ ...e, itemType: 'entry' as const }))];
    items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const result: any[] = [];
    let lastEndTime = '00:00';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let maxEntryEnd = 0;
    for (const e of items) maxEntryEnd = Math.max(maxEntryEnd, timeToMinutes(e.endTime));
    const endMinutes = isToday ? Math.max(currentMinutes, maxEntryEnd) : 1440;

    for (const entry of items) {
      const entryStart = timeToMinutes(entry.startTime);
      if (entryStart > timeToMinutes(lastEndTime)) {
        const gapStart = timeToMinutes(lastEndTime);
        const gapEnd = Math.min(entryStart, endMinutes);
        if (gapEnd > gapStart) result.push({ id: `gap-${gapStart}`, startTime: minutesToTime(gapStart), endTime: minutesToTime(gapEnd), category: '未记录', durationMinutes: gapEnd - gapStart, itemType: 'gap' });
      }
      result.push(entry);
      if (timeToMinutes(entry.endTime) > timeToMinutes(lastEndTime)) lastEndTime = entry.endTime;
    }
    if (timeToMinutes(lastEndTime) < endMinutes) {
      result.push({ id: `gap-${timeToMinutes(lastEndTime)}`, startTime: lastEndTime, endTime: minutesToTime(endMinutes), category: '未记录', durationMinutes: endMinutes - timeToMinutes(lastEndTime), itemType: 'gap' });
    }
    return result;
  }, [entries, isToday]);

  const uncompletedTodos = todos.filter(t => !t.completed && !t.isArchived);
  const photoCount = (entry: TimeEntry) => entry.photos?.length || 0;

  return (
    <div className="pb-20">
      <Header
        title={
          <div className="flex items-center gap-2">
            <button onClick={handlePrevDay} className="p-1 active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
            <span onClick={onDateClick} className="font-medium min-w-[60px] text-center cursor-pointer">{displayDate}</span>
            <button onClick={handleNextDay} className="p-1 active:scale-90 transition-transform"><ChevronRight size={20} /></button>
          </div>
        }
        leftIcon={<ArrowLeftRight size={22} />}
        onMoreClick={onMoreClick}
        rightIcons={<BarChart2 size={22} />}
      />

      <div className="bg-white px-4 py-2 flex items-center justify-end border-b border-gray-50">
        <div className="flex items-center gap-2 text-yellow-500 text-sm">
          <span className="truncate max-w-[150px] flex items-center gap-1"><BookOpen size={14} /> 时间管理秘籍&爱时间使用教程</span>
          <X size={16} className="text-gray-300 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-white relative">
        <TimeCircle entries={entries} onSelectEntry={handleCircleSelect} selectedEntryId={selectedEntry?.id} isToday={isToday} />
        {activeTimer && isToday && (
          <div onClick={onTimerClick} className="absolute top-4 right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_12px_rgba(250,204,21,0.5)] cursor-pointer">
            {activeTimer.goal.category} {elapsed}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {activeTimer && isToday && (
          <div onClick={onTimerClick} className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-b border-yellow-100 cursor-pointer active:bg-yellow-100 transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-yellow-600 text-sm font-mono w-24">进行中...</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[activeTimer.goal.category] }} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-yellow-700">{activeTimer.goal.category}</span>
                  <span className="text-yellow-600 text-xs font-mono">{elapsed}</span>
                </div>
                <p className="text-yellow-500 text-xs mt-0.5">正在记录: {activeTimer.goal.title}</p>
              </div>
            </div>
          </div>
        )}
        {timelineItems.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Clock size={48} className="mx-auto mb-2 opacity-10" />
            <p>这一天还没有记录呢</p>
          </div>
        ) : (
          timelineItems.map((item) => (
            <div key={item.id}
              ref={(el) => { if (item.itemType === 'entry') timelineRefs.current[item.id] = el; }}
              onClick={() => {
                if (item.itemType === 'entry') {
                  onQuickNote(item);
                } else {
                  onAddEntry({ startTime: item.startTime, endTime: item.endTime });
                }
              }}
              className={`flex items-stretch justify-between px-4 border-b border-gray-50 transition-colors cursor-pointer active:bg-gray-50 ${selectedEntry?.id === item.id ? 'bg-blue-50' : 'bg-white'}`}
            >
              <div className="flex items-stretch gap-3">
                <div className="flex items-center py-3">
                  <span className="text-gray-400 text-xs font-mono w-20 text-right">{item.startTime}~{item.endTime}</span>
                </div>
                <div className="relative flex items-center justify-center w-4">
                  <div className="absolute top-0 bottom-0 w-px bg-gray-100 -z-10" />
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 z-10" style={{ backgroundColor: item.itemType === 'entry' ? CATEGORY_COLORS[item.category] : '#E5E7EB' }} />
                </div>
                <div className="flex flex-col justify-center py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${item.itemType === 'gap' ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>{item.category}</span>
                    <span className="text-gray-400 text-[10px]">{item.durationMinutes} 分钟</span>
                    {item.itemType === 'entry' && photoCount(item) > 0 && (
                      <span className="flex items-center gap-0.5 text-gray-400 text-[10px]"><Camera size={10} />{photoCount(item)}</span>
                    )}
                  </div>
                  {item.note && <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{item.note}</p>}
                  {item.itemType === 'entry' && (item.linkedTodoId || item.linkedGoalId) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.linkedTodoId && (() => {
                        const todo = todos.find((t: Todo) => t.id === item.linkedTodoId);
                        return todo ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px]">
                            <CheckSquare size={8} />{todo.title}
                          </span>
                        ) : null;
                      })()}
                      {item.linkedGoalId && (() => {
                        const goal = goals.find((g: Goal) => g.id === item.linkedGoalId);
                        return goal ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-500 rounded text-[9px]">
                            <Target size={8} />{goal.title}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {item.itemType === 'entry' && <ChevronRight size={14} className="text-gray-300" />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Today's Todos summary */}
      {uncompletedTodos.length > 0 && isToday && (
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-600">今日待办 ({uncompletedTodos.length})</h3>
            <button onClick={() => onTabChange('todo')} className="text-xs text-[#6DADD1]">查看全部</button>
          </div>
          <div className="space-y-2">
            {uncompletedTodos.slice(0, 3).map(todo => (
              <div key={todo.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: todo.quadrant === '重要且紧急' ? '#FF5C5C' : todo.quadrant === '重要不紧急' ? '#FFA726' : todo.quadrant === '不重要但紧急' ? '#42A5F5' : '#2ECA8B' }} />
                <span className="text-sm text-gray-700 truncate">{todo.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
