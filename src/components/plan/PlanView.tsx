import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, BarChart2, Download, Trash, ArrowLeftRight } from 'lucide-react';
import Header from '../common/Header';
import MarkdownText from '../common/MarkdownText';
import type { TimeEntry } from '../../types';
import { CATEGORY_COLORS, getLocalDateString } from '../../constants';

interface PlanViewProps {
  entries: TimeEntry[];
  activeTimer: any;
  selectedDate: string;
  isToday: boolean;
  onDateChange: (date: string) => void;
  onDateClick: () => void;
  elapsed: string;
}

export default function PlanView({ entries, activeTimer, selectedDate, isToday, onDateChange, onDateClick, elapsed }: PlanViewProps) {
  const handlePrevDay = () => { const [y, m, d] = selectedDate.split('-').map(Number); onDateChange(getLocalDateString(new Date(y, m - 1, d - 1))); };
  const handleNextDay = () => { const [y, m, d] = selectedDate.split('-').map(Number); onDateChange(getLocalDateString(new Date(y, m - 1, d + 1))); };

  const displayDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (isToday) return '今天';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === getLocalDateString(yesterday)) return '昨天';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDate === getLocalDateString(tomorrow)) return '明天';
    return `${m}月${d}日`;
  }, [selectedDate, isToday]);

  return (
    <div className="pb-20">
      <Header title={
        <div className="flex items-center gap-2">
          <button onClick={handlePrevDay} className="p-1 active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
          <span onClick={onDateClick} className="font-medium min-w-[60px] text-center cursor-pointer">{displayDate}</span>
          <button onClick={handleNextDay} className="p-1 active:scale-90 transition-transform"><ChevronRight size={20} /></button>
        </div>
      } leftIcon={<div className="grid grid-cols-2 gap-0.5"><div className="w-2 h-2 bg-white rounded-sm"></div><div className="w-2 h-2 bg-white rounded-sm"></div><div className="w-2 h-2 bg-white rounded-sm"></div><div className="w-2 h-2 bg-white rounded-sm"></div></div>}
        rightIcons={<BarChart2 size={22} />} />

      <div className="flex h-[calc(100vh-112px)]">
        <div className="flex-1 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-3 flex items-center justify-between bg-white border-b border-gray-100">
            <div className="flex items-center gap-2"><Download size={18} className="text-gray-400" /><span className="font-medium">今日计划</span></div>
            <Trash size={18} className="text-gray-400" />
          </div>
          <div className="p-2 space-y-2 flex-1 overflow-y-auto">
            <div className="text-xs font-bold text-gray-700 px-1">00:00~24:00 <span className="text-gray-400 font-normal">(24小时)</span></div>
            <div className="bg-white rounded-xl p-4 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <span className="text-sm">未计划</span><span className="text-xs">点击添加</span>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 flex flex-col">
          <div className="p-3 flex items-center justify-between bg-white border-b border-gray-100">
            <span className="font-medium">实际情况</span><ArrowLeftRight size={18} className="text-gray-400" />
          </div>
          <div className="p-2 space-y-2 flex-1 overflow-y-auto">
            {activeTimer && (
              <div className="bg-yellow-100/50 border border-yellow-200 border-l-4 border-l-yellow-400 rounded-xl p-3">
                <div className="text-yellow-600 text-xs font-bold">正计时中</div>
                <div className="text-lg font-mono text-gray-700 mt-1">{elapsed}</div>
                <div className="text-sm text-gray-600">{activeTimer.goal.category}</div>
              </div>
            )}
            <div className="text-xs font-bold text-gray-700 px-1 mt-4">00:00~24:00 <span className="text-gray-400 font-normal">(24小时)</span></div>
            {entries.slice().sort((a, b) => a.startTime.localeCompare(b.startTime)).map(entry => (
              <div key={entry.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">{entry.startTime}~{entry.endTime}</span>
                  <span className="text-[10px] font-bold" style={{ color: CATEGORY_COLORS[entry.category] }}>{entry.category}</span>
                </div>
                {entry.note ? (
                  <MarkdownText text={entry.note} className="mt-1 truncate text-xs text-gray-600" />
                ) : (
                  <div className="mt-1 truncate text-xs text-gray-600">{entry.category}</div>
                )}
              </div>
            ))}
            <div className="bg-white rounded-xl p-4 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <span className="text-sm">未记录</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
