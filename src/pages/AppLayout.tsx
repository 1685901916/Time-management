import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Play } from 'lucide-react';
import BottomNav from '../components/common/BottomNav';
import DatePickerModal from '../components/common/DatePickerModal';
import DropdownMenu from '../components/common/DropdownMenu';
import TimeView from '../components/time/TimeView';
import EditView from '../components/time/EditView';
import TodoView from '../components/todo/TodoView';
import TodoEditView from '../components/todo/TodoEditView';
import GoalsView from '../components/goal/GoalsView';
import AddGoalView from '../components/goal/AddGoalView';
import DailyAnalysisView from '../components/goal/DailyAnalysisView';
import MeView from '../components/me/MeView';
import TimerOverlay from '../components/timer/TimerOverlay';
import QuickNoteModal from '../components/notes/QuickNoteModal';
import { useEntries } from '../hooks/useEntries';
import { useGoals } from '../hooks/useGoals';
import { useTodos } from '../hooks/useTodos';
import { useTimer } from '../hooks/useTimer';
import { getLocalDateString } from '../constants';
import { getStats } from '../api/entries';
import type { TimeEntry, Todo, Goal, Stats } from '../types';

interface AppLayoutProps {
  user: any;
  onLogout: () => void;
}

export default function AppLayout({ user, onLogout }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState('time');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const [editingEntry, setEditingEntry] = useState<Partial<TimeEntry> | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isTimerOverlayVisible, setIsTimerOverlayVisible] = useState(false);
  const [quickNoteEntry, setQuickNoteEntry] = useState<TimeEntry | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const { entries, loading: entriesLoading, fetchEntries, createEntry, updateEntry, deleteEntry } = useEntries();
  const { goals, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { todos, fetchTodos, createTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const { activeTimer, elapsed, note: timerNote, startTimer, clearTimer, setNote: setTimerNote, getElapsedMinutes } = useTimer();

  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;
  const filteredEntries = useMemo(() => entries.filter(e => e.date === selectedDate && !e.isArchived), [entries, selectedDate]);

  // Fetch data on mount and date change
  useEffect(() => { fetchEntries(selectedDate); }, [selectedDate, fetchEntries]);
  useEffect(() => { fetchGoals(); }, [fetchGoals]);
  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  // Fetch stats when on 'me' tab
  useEffect(() => {
    if (activeTab === 'me') {
      getStats().then(setStats).catch(() => {});
    }
  }, [activeTab]);

  // --- Handlers ---

  const handleSaveEntry = useCallback(async (entry: TimeEntry) => {
    if (entry.id && entries.some(e => e.id === entry.id)) {
      await updateEntry(entry.id, entry);
    } else {
      await createEntry({
        date: entry.date || selectedDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        category: entry.category,
        note: entry.note,
        durationMinutes: entry.durationMinutes,
      });
    }
    setEditingEntry(null);
  }, [entries, selectedDate, createEntry, updateEntry]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    if (!window.confirm('确定要删除这条时间记录吗？')) return;
    await deleteEntry(id);
    setEditingEntry(null);
  }, [deleteEntry]);

  const handleStartTimer = useCallback((goal: Goal) => {
    if (activeTimer) { setIsTimerOverlayVisible(true); return; }
    startTimer(goal);
    setIsTimerOverlayVisible(true);
    setActiveTab('time');
    setSelectedDate(getLocalDateString());
  }, [activeTimer, startTimer]);

  const handleFinishTimer = useCallback(async () => {
    if (!activeTimer) return;
    const endTime = new Date();
    const startTime = new Date(activeTimer.startTime);
    const durationMinutes = Math.max(1, getElapsedMinutes());
    const formatTime = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const startStr = formatTime(startTime);
    const endStr = formatTime(endTime);
    const startDateStr = getLocalDateString(startTime);

    await createEntry({
      date: startDateStr,
      startTime: startStr,
      endTime: endStr,
      category: activeTimer.goal.category,
      note: timerNote.trim() || activeTimer.goal.title,
      durationMinutes,
      linkedGoalId: activeTimer.goal.id,
    });
    clearTimer();
    setIsTimerOverlayVisible(false);
    setSelectedDate(getLocalDateString());
  }, [activeTimer, getElapsedMinutes, createEntry, timerNote, clearTimer]);

  const handleAddGoal = useCallback(async (goal: Goal) => {
    const created = await createGoal({ title: goal.title, subtitle: goal.subtitle, category: goal.category });
    setIsAddingGoal(false);
    // Auto-start timer with the new goal
    if (created && !activeTimer) {
      startTimer(created);
      setIsTimerOverlayVisible(true);
      setActiveTab('time');
      setSelectedDate(getLocalDateString());
    }
  }, [createGoal, activeTimer, startTimer]);

  const handleUpdateGoal = useCallback(async (id: string, data: { title?: string; subtitle?: string; category?: string }) => {
    await updateGoal(id, data);
  }, [updateGoal]);

  const handleDeleteGoal = useCallback(async (id: string) => {
    await deleteGoal(id);
  }, [deleteGoal]);

  const handleAddTodo = useCallback(async (title: string, quadrant: string, note?: string) => {
    await createTodo({ title, quadrant: quadrant as any, note });
  }, [createTodo]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    if (!window.confirm('确定要删除这条待办吗？')) return;
    await deleteTodo(id);
    setEditingTodo(null);
  }, [deleteTodo]);

  const handleSaveTodo = useCallback(async (todo: Todo) => {
    const exists = todos.some(t => t.id === todo.id);
    if (exists) {
      await updateTodo(todo.id, todo);
    } else {
      await createTodo({ ...todo, date: todo.date });
    }
    setEditingTodo(null);
  }, [todos, selectedDate, updateTodo, createTodo]);

  const handleQuickNote = useCallback((entry: TimeEntry) => {
    setQuickNoteEntry(entry);
  }, []);

  const handleQuickNoteSave = useCallback(async (entryId: string, note: string, linkedTodoId?: string, linkedGoalId?: string) => {
    await updateEntry(entryId, { note, linkedTodoId, linkedGoalId });
    setQuickNoteEntry(null);
  }, [updateEntry]);

  // --- Render ---

  const renderView = () => {
    switch (activeTab) {
      case 'time':
        return (
          <TimeView entries={filteredEntries} todos={todos} goals={goals} activeTimer={activeTimer} selectedDate={selectedDate} isToday={isToday}
            onDateChange={setSelectedDate} onDateClick={() => setIsDatePickerOpen(true)} onEdit={setEditingEntry} onAddEntry={setEditingEntry}
            onMoreClick={() => setIsMenuOpen(true)} onTimerClick={() => setIsTimerOverlayVisible(true)} onQuickNote={handleQuickNote}
            onTabChange={setActiveTab} elapsed={elapsed} />
        );
      case 'todo':
        return <TodoView todos={todos} onAdd={handleAddTodo} onToggle={toggleTodo} onDelete={handleDeleteTodo} onEdit={setEditingTodo}
          selectedDate={selectedDate} onDateChange={setSelectedDate} onDateClick={() => setIsDatePickerOpen(true)} onMoreClick={() => setIsMenuOpen(true)} />;
      case 'goal':
        return isAddingGoal ? null : (
          <GoalsView goals={goals} onStart={handleStartTimer} onAdd={() => setIsAddingGoal(true)}
            onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} onMoreClick={() => setIsMenuOpen(true)} />
        );
      case 'analysis':
        return <DailyAnalysisView entries={filteredEntries} selectedDate={selectedDate}
          onDateChange={setSelectedDate} onDateClick={() => setIsDatePickerOpen(true)} onMoreClick={() => setIsMenuOpen(true)} />;
      case 'me':
        return <MeView onMoreClick={() => setIsMenuOpen(true)} user={user} stats={stats} onLogout={onLogout} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 pb-20 max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      {renderView()}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {isAddingGoal && <AddGoalView onSave={handleAddGoal} onCancel={() => setIsAddingGoal(false)} />}

      {/* Bottom action buttons for Time tab */}
      {activeTab === 'time' && showBottomButtons && !isAddingGoal && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center bg-[#F2F2F2] rounded-full p-1 shadow-sm z-40">
          <button className="px-6 py-2 text-sm text-gray-500 font-medium active:bg-gray-200 rounded-full transition-colors"
            onClick={() => { activeTimer ? setIsTimerOverlayVisible(true) : setActiveTab('goal'); }}>
            {activeTimer ? '详情' : '开始'}
          </button>
          <div className="flex items-center bg-[#6DADD1] text-white rounded-full px-4 py-2.5 gap-3 shadow-md">
            <button onClick={() => {
              const todayEntries = entries.filter(e => e.date === selectedDate && !e.isArchived);
              let defaultStart = '08:00';
              if (todayEntries.length > 0) {
                const latest = todayEntries.reduce((max, e) => e.endTime > max ? e.endTime : max, '00:00');
                if (latest !== '24:00') defaultStart = latest;
              }
              let defaultEnd = '09:00';
              if (selectedDate === getLocalDateString()) {
                const now = new Date();
                defaultEnd = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
              } else {
                const [h, m] = defaultStart.split(':').map(Number);
                defaultEnd = `${Math.min(23, h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              }
              setEditingEntry({ startTime: defaultStart, endTime: defaultEnd, category: '学习' });
            }} className="active:scale-90 transition-transform"><Plus size={22} /></button>
            <div className="w-[1px] h-5 bg-white/30" />
            <button onClick={() => { activeTimer ? setIsTimerOverlayVisible(true) : setActiveTab('goal'); }} className="active:scale-90 transition-transform">
              <Play size={22} fill="currentColor" />
            </button>
          </div>
          <button className="px-6 py-2 text-sm text-gray-500 font-medium active:bg-gray-200 rounded-full transition-colors"
            onClick={() => { if (activeTimer) handleFinishTimer(); }}>
            {activeTimer ? '结束' : '暂停'}
          </button>
        </div>
      )}

      {/* Timer Overlay */}
      {activeTimer && isTimerOverlayVisible && (
        <TimerOverlay timer={activeTimer} note={timerNote} elapsed={elapsed} onNoteChange={setTimerNote} onFinish={handleFinishTimer} onCancel={() => setIsTimerOverlayVisible(false)} />
      )}

      <DropdownMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} showBottomButtons={showBottomButtons} onToggleBottomButtons={() => setShowBottomButtons(!showBottomButtons)} />

      {editingEntry && <EditView entry={editingEntry} onSave={handleSaveEntry} onCancel={() => setEditingEntry(null)} onDelete={handleDeleteEntry} />}
      {editingTodo && <TodoEditView todo={editingTodo} onSave={handleSaveTodo} onCancel={() => setEditingTodo(null)} onDelete={handleDeleteTodo} />}
      <DatePickerModal isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <QuickNoteModal isOpen={!!quickNoteEntry} onClose={() => setQuickNoteEntry(null)} entry={quickNoteEntry} onSave={handleQuickNoteSave} onEdit={(e) => { setQuickNoteEntry(null); setEditingEntry(e); }} onPhotoChange={() => fetchEntries(selectedDate)} todos={todos} goals={goals} />
    </div>
  );
}
