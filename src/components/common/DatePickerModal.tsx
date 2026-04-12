import { X } from 'lucide-react';
import { getLocalDateString } from '../../constants';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function DatePickerModal({ isOpen, onClose, selectedDate, onSelectDate }: DatePickerModalProps) {
  if (!isOpen) return null;

  const [y, m, d] = selectedDate.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayOfMonth = new Date(y, m - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">选择日期</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="text-gray-500 text-sm">{y}年</div>
          <div className="text-2xl font-bold text-gray-800">{m}月{d}日</div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {weekDays.map(wd => (
            <div key={wd} className="text-xs text-gray-400 font-medium py-2">{wd}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {emptyDays.map(i => <div key={`empty-${i}`} className="p-2" />)}
          {days.map(day => {
            const isSelected = day === d;
            const isToday = getLocalDateString(new Date(y, m - 1, day)) === getLocalDateString();
            return (
              <button
                key={day}
                onClick={() => { onSelectDate(getLocalDateString(new Date(y, m - 1, day))); onClose(); }}
                className={`p-2 rounded-full w-10 h-10 mx-auto flex items-center justify-center text-sm font-medium transition-colors ${
                  isSelected ? 'bg-[#6DADD1] text-white shadow-md' :
                  isToday ? 'bg-blue-50 text-[#6DADD1]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
