import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/common/BottomNav';
import DatePickerModal from '../components/common/DatePickerModal';
import DropdownMenu from '../components/common/DropdownMenu';
import GoalsView from '../components/goal/GoalsView';
import DailyAnalysisView from '../components/goal/DailyAnalysisView';
import MeView from '../components/me/MeView';
import QuickNoteModal from '../components/notes/QuickNoteModal';
import TimeView from '../components/time/TimeView';
import EditView from '../components/time/EditView';
import AddGoalView from '../components/goal/AddGoalView';
import TimerOverlay from '../components/timer/TimerOverlay';
import TodoEditView from '../components/todo/TodoEditView';
import TodoView from '../components/todo/TodoView';
import { getStats } from '../api/entries';
import { EDITABLE_CATEGORY_VALUES, getLocalDateString, normalizeCategory } from '../constants';
import { useEntries } from '../hooks/useEntries';
import { useGoals } from '../hooks/useGoals';
import { useTimer } from '../hooks/useTimer';
import { useTodos } from '../hooks/useTodos';
import type { CategoryType, Goal, Stats, TimeEntry, Todo } from '../types';

interface AppLayoutProps {
  user: any;
  onLogout: () => void;
}

const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const getComparableRange = (entry: Pick<TimeEntry, 'startTime' | 'endTime'>) => {
  const start = timeToMinutes(entry.startTime);
  const end = timeToMinutes(entry.endTime);
  if (start > end) return { start: start - 24 * 60, end };
  return { start, end };
};

const rangesOverlap = (
  first: Pick<TimeEntry, 'startTime' | 'endTime'>,
  second: Pick<TimeEntry, 'startTime' | 'endTime'>
) => {
  const a = getComparableRange(first);
  const b = getComparableRange(second);
  return Math.max(a.start, b.start) < Math.min(a.end, b.end);
};

export default function AppLayout({ user, onLogout }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState('time');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBottomButtons, setShowBottomButtons] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('itime.showBottomButtons');
    return stored === null ? true : stored === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('itime.showBottomButtons', showBottomButtons ? '1' : '0');
  }, [showBottomButtons]);
  const [editingEntry, setEditingEntry] = useState<Partial<TimeEntry> | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isTimerOverlayVisible, setIsTimerOverlayVisible] = useState(false);
  const [quickNoteEntry, setQuickNoteEntry] = useState<TimeEntry | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const { entries, fetchEntries, createEntry, updateEntry, deleteEntry } = useEntries();
  const { goals, fetchGoals, createGoal, updateGoal, reorderGoals, deleteGoal } = useGoals();
  const { todos, fetchTodos, createTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const { activeTimer, elapsed, note: timerNote, startTimer, clearTimer, setNote: setTimerNote, getElapsedMinutes } = useTimer();

  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;
  const categoryOptions = useMemo(() => {
    const options = new Set<CategoryType>();
    EDITABLE_CATEGORY_VALUES.forEach((category) => {
      if (category !== '未记录') options.add(category);
    });
    goals.forEach((goal) => {
      const category = normalizeCategory(goal.category);
      if (category !== '未记录') options.add(category);
    });
    return Array.from(options);
  }, [goals]);
  const filteredEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate && !entry.isArchived),
    [entries, selectedDate]
  );

  useEffect(() => {
    fetchEntries(selectedDate);
  }, [selectedDate, fetchEntries]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    if (activeTab === 'me') {
      getStats().then(setStats).catch(() => {});
    }
  }, [activeTab]);

  const handleSaveEntry = useCallback(
    async (entry: TimeEntry) => {
      const entryDate = entry.date || selectedDate;
      const conflicts = entries.filter(
        (currentEntry) =>
          currentEntry.date === entryDate &&
          !currentEntry.isArchived &&
          currentEntry.id !== entry.id &&
          rangesOverlap(entry, currentEntry)
      );

      if (conflicts.length > 0) {
        const description = conflicts
          .map((conflict) => `${conflict.startTime}-${conflict.endTime} ${conflict.category}`)
          .join('、');
        const confirmed = window.confirm(
          `本次保存会覆盖以下重叠记录：\n${description}\n\n确认继续？`
        );
        if (!confirmed) {
          return;
        }
        await Promise.all(conflicts.map((conflict) => deleteEntry(conflict.id)));
      }

      if (entry.id && entries.some((currentEntry) => currentEntry.id === entry.id)) {
        await updateEntry(entry.id, entry);
      } else {
        await createEntry({
          date: entryDate,
          startTime: entry.startTime,
          endTime: entry.endTime,
          category: entry.category,
          note: entry.note,
          durationMinutes: entry.durationMinutes,
        });
      }
      setEditingEntry(null);
    },
    [entries, selectedDate, createEntry, updateEntry, deleteEntry]
  );

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      if (!window.confirm('确定要删除这条时间记录吗？')) return;
      await deleteEntry(id);
      setEditingEntry(null);
    },
    [deleteEntry]
  );

  const handleMergeEntry = useCallback(
    async (entry: TimeEntry) => {
      if (!entry.id) return;

      const sameDayEntries = entries
        .filter((currentEntry) => currentEntry.date === entry.date && !currentEntry.isArchived)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

      const currentIndex = sameDayEntries.findIndex((currentEntry) => currentEntry.id === entry.id);
      if (currentIndex <= 0) {
        window.alert('没有可合并的上一条记录');
        return;
      }

      const previous = sameDayEntries[currentIndex - 1];
      const confirmed = window.confirm(
        `确定将 ${previous.startTime}-${previous.endTime} 与 ${entry.startTime}-${entry.endTime} 向上合并吗？`
      );
      if (!confirmed) return;

      const mergedNote = [previous.note?.trim(), entry.note?.trim()].filter(Boolean).join('\n\n');
      await updateEntry(previous.id, {
        startTime: previous.startTime,
        endTime: entry.endTime,
        category: previous.category,
        note: mergedNote || undefined,
        linkedTodoId: previous.linkedTodoId || entry.linkedTodoId,
        linkedGoalId: previous.linkedGoalId || entry.linkedGoalId,
      });
      await deleteEntry(entry.id);
      setEditingEntry(null);
    },
    [entries, updateEntry, deleteEntry]
  );

  const handleStartTimer = useCallback(
    async (goal: Goal) => {
      if (activeTimer) {
        setIsTimerOverlayVisible(true);
        return;
      }
      await startTimer(goal);
      setIsTimerOverlayVisible(true);
      setSelectedDate(getLocalDateString());
    },
    [activeTimer, startTimer]
  );

  const handleFinishTimer = useCallback(async () => {
    if (!activeTimer) return;

    const endTime = new Date();
    const startTime = new Date(activeTimer.startTime);
    const durationMinutes = Math.max(1, getElapsedMinutes());
    const formatTime = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const startStr = formatTime(startTime);
    const endStr = formatTime(endTime);
    const endDateStr = getLocalDateString(endTime);

    await createEntry({
      date: endDateStr,
      startTime: startStr,
      endTime: endStr,
      category: activeTimer.goal.category,
      note: timerNote.trim(),
      durationMinutes,
      linkedGoalId: activeTimer.goal.id,
    });

    await clearTimer();
    setIsTimerOverlayVisible(false);
    setSelectedDate(getLocalDateString());
  }, [activeTimer, getElapsedMinutes, createEntry, timerNote, clearTimer]);

  const handleDiscardTimer = useCallback(async () => {
    if (!window.confirm('确定取消这次计时吗？当前进度会被清除。')) return;
    await clearTimer();
    setIsTimerOverlayVisible(false);
  }, [clearTimer]);

  const handleAddGoal = useCallback(
    async (goal: Goal) => {
      const created = await createGoal({
        title: goal.title,
        subtitle: goal.subtitle,
        category: goal.category,
        color: goal.color,
      });
      setIsAddingGoal(false);
      if (created && !activeTimer) {
        await startTimer(created);
        setIsTimerOverlayVisible(true);
        setSelectedDate(getLocalDateString());
      }
    },
    [createGoal, activeTimer, startTimer]
  );

  const handleUpdateGoal = useCallback(
    async (id: string, data: { title?: string; subtitle?: string; category?: string; color?: string; sortOrder?: number }) => {
      await updateGoal(id, data);
    },
    [updateGoal]
  );

  const handleReorderGoals = useCallback(
    async (goalIds: string[]) => {
      await reorderGoals(goalIds);
    },
    [reorderGoals]
  );

  const handleDeleteGoal = useCallback(
    async (id: string) => {
      await deleteGoal(id);
    },
    [deleteGoal]
  );

  const handleAddTodo = useCallback(
    async (title: string, quadrant: string, note?: string) => {
      await createTodo({ title, quadrant: quadrant as any, note });
    },
    [createTodo]
  );

  const handleDeleteTodo = useCallback(
    async (id: string) => {
      if (!window.confirm('确定要删除这条待办吗？')) return;
      await deleteTodo(id);
      setEditingTodo(null);
    },
    [deleteTodo]
  );

  const handleSaveTodo = useCallback(
    async (todo: Todo) => {
      const exists = todos.some((currentTodo) => currentTodo.id === todo.id);
      if (exists) {
        await updateTodo(todo.id, todo);
      } else {
        await createTodo({ ...todo, date: todo.date });
      }
      setEditingTodo(null);
    },
    [todos, updateTodo, createTodo]
  );

  const handleQuickNote = useCallback((entry: TimeEntry) => {
    setQuickNoteEntry(entry);
  }, []);

  const handleQuickNoteSave = useCallback(
    async (entryId: string, note: string, linkedTodoId?: string, linkedGoalId?: string) => {
      await updateEntry(entryId, { note, linkedTodoId, linkedGoalId });
      setQuickNoteEntry(null);
    },
    [updateEntry]
  );

  const renderView = () => {
    switch (activeTab) {
      case 'time':
        return (
          <TimeView
            entries={filteredEntries}
            todos={todos}
            goals={goals}
            activeTimer={activeTimer}
            selectedDate={selectedDate}
            isToday={isToday}
            onDateChange={setSelectedDate}
            onDateClick={() => setIsDatePickerOpen(true)}
            onEdit={setEditingEntry}
            onAddEntry={setEditingEntry}
            onEditTime={setEditingEntry}
            onMoreClick={() => setIsMenuOpen(true)}
            onTimerClick={() => setIsTimerOverlayVisible(true)}
            onQuickNote={handleQuickNote}
            onTabChange={setActiveTab}
            elapsed={elapsed}
          />
        );
      case 'todo':
        return (
          <TodoView
            todos={todos}
            onAdd={handleAddTodo}
            onToggle={toggleTodo}
            onDelete={handleDeleteTodo}
            onEdit={setEditingTodo}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onDateClick={() => setIsDatePickerOpen(true)}
            onMoreClick={() => setIsMenuOpen(true)}
          />
        );
      case 'goal':
        return isAddingGoal ? null : (
          <GoalsView
            goals={goals}
            onStart={handleStartTimer}
            onAdd={() => setIsAddingGoal(true)}
            onUpdate={handleUpdateGoal}
            onDelete={handleDeleteGoal}
            onReorder={handleReorderGoals}
            onMoreClick={() => setIsMenuOpen(true)}
            categoryOptions={categoryOptions}
          />
        );
      case 'analysis':
        return (
          <DailyAnalysisView
            entries={filteredEntries}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onDateClick={() => setIsDatePickerOpen(true)}
            onMoreClick={() => setIsMenuOpen(true)}
            categoryOptions={categoryOptions}
          />
        );
      case 'me':
        return <MeView onMoreClick={() => setIsMenuOpen(true)} user={user} stats={stats} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative mx-auto min-h-screen w-full overflow-x-hidden bg-slate-50 pb-28 font-sans text-slate-800 shadow-2xl lg:pb-0 lg:shadow-none">
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="lg:pl-64">
        {renderView()}
      </div>

      {isAddingGoal && <AddGoalView onSave={handleAddGoal} onCancel={() => setIsAddingGoal(false)} />}

      {activeTimer && isTimerOverlayVisible && (
        <TimerOverlay
          timer={activeTimer}
          note={timerNote}
          elapsed={elapsed}
          onNoteChange={setTimerNote}
          onFinish={handleFinishTimer}
          onCancel={() => setIsTimerOverlayVisible(false)}
          onDiscard={handleDiscardTimer}
        />
      )}

      <DropdownMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        showBottomButtons={showBottomButtons}
        onToggleBottomButtons={() => setShowBottomButtons(!showBottomButtons)}
      />

      {editingEntry && (
        <EditView
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={() => setEditingEntry(null)}
          onDelete={handleDeleteEntry}
          onMergePrevious={handleMergeEntry}
          categoryOptions={categoryOptions}
        />
      )}
      {editingTodo && (
        <TodoEditView todo={editingTodo} onSave={handleSaveTodo} onCancel={() => setEditingTodo(null)} onDelete={handleDeleteTodo} />
      )}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <QuickNoteModal
        isOpen={!!quickNoteEntry}
        onClose={() => setQuickNoteEntry(null)}
        entry={quickNoteEntry}
        onSave={handleQuickNoteSave}
        onEdit={(entry) => {
          setQuickNoteEntry(null);
          setEditingEntry(entry);
        }}
        onUpdateTime={async (entryId, data) => {
          const currentEntry = entries.find((entry) => entry.id === entryId);
          if (currentEntry && data.startTime && data.endTime) {
            const nextEntry = { ...currentEntry, ...data };
            const conflicts = entries.filter(
              (entry) =>
                entry.date === currentEntry.date &&
                !entry.isArchived &&
                entry.id !== entryId &&
                rangesOverlap(nextEntry, entry)
            );
            if (conflicts.length > 0) {
              const description = conflicts
                .map((conflict) => `${conflict.startTime}-${conflict.endTime} ${conflict.category}`)
                .join('、');
              const confirmed = window.confirm(
                `本次调整会覆盖以下重叠记录：\n${description}\n\n确认继续？`
              );
              if (!confirmed) {
                return false;
              }
              await Promise.all(conflicts.map((conflict) => deleteEntry(conflict.id)));
            }
          }
          await updateEntry(entryId, data);
          return true;
        }}
        onPhotoChange={() => fetchEntries(selectedDate)}
        todos={todos}
        goals={goals}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}
