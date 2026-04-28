import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { getLocalDateString } from '../../constants';
import { getEntriesRange } from '../../api/entries';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function DatePickerModal({ isOpen, onClose, selectedDate, onSelectDate }: DatePickerModalProps) {
  const [displayDate, setDisplayDate] = useState(selectedDate);
  const [monthRecordDates, setMonthRecordDates] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setDisplayDate(selectedDate);
  }, [isOpen, selectedDate]);

  const [y, m] = displayDate.split('-').map(Number);
  const [selectedYear, selectedMonth, d] = selectedDate.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayOfMonth = new Date(y, m - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  const recordDateSet = useMemo(() => new Set(monthRecordDates), [monthRecordDates]);

  useEffect(() => {
    if (!isOpen) return;
    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const to = getLocalDateString(new Date(y, m, 0));
    getEntriesRange(from, to)
      .then((items) => setMonthRecordDates(Array.from(new Set(items.map((entry) => entry.date)))))
      .catch(() => setMonthRecordDates([]));
  }, [isOpen, y, m]);

  if (!isOpen) return null;

  const goMonth = (offset: number) => {
    setDisplayDate(getLocalDateString(new Date(y, m - 1 + offset, 1)));
  };

  const goYear = (offset: number) => {
    setDisplayDate(getLocalDateString(new Date(y + offset, m - 1, 1)));
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end lg:items-center lg:justify-center lg:p-6">
      <div className="absolute inset-0 bg-slate-950/35" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 lg:max-w-xl lg:rounded-[28px]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">选择日期</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 transition-transform active:scale-90">
            <X size={20} />
          </button>
        </div>
        <div className="mb-6 grid grid-cols-[96px_1fr_96px] items-center text-center">
          <div className="flex justify-start gap-1">
            <button onClick={() => goYear(-1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100" aria-label="上一年">
              <ChevronsLeft size={18} />
            </button>
            <button onClick={() => goMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100" aria-label="上个月">
              <ChevronLeft size={18} />
            </button>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">{y}年</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {m}月{selectedYear === y && selectedMonth === m ? `${d}日` : ''}
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <button onClick={() => goMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100" aria-label="下个月">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => goYear(1)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100" aria-label="下一年">
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-2 text-center">
          {weekDays.map(wd => (
            <div key={wd} className="py-2 text-xs font-medium text-slate-400">{wd}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {emptyDays.map(i => <div key={`empty-${i}`} className="p-2" />)}
          {days.map(day => {
            const dateString = getLocalDateString(new Date(y, m - 1, day));
            const isSelected = dateString === selectedDate;
            const isToday = dateString === getLocalDateString();
            const hasRecord = recordDateSet.has(dateString);
            return (
              <button
                key={day}
                onClick={() => { onSelectDate(dateString); onClose(); }}
                className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full p-2 text-sm font-semibold transition-colors ${
                  isSelected ? 'bg-teal-600 text-white shadow-md' :
                  isToday ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {day}
                {hasRecord && (
                  <span
                    className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-600'}`}
                    aria-label="这天有记录"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
