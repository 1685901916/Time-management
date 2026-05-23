import { useMemo, useState } from 'react';
import { ChevronLeft, Plus, Trash2, X } from 'lucide-react';
import type { TimeEntry, CategoryType } from '../../types';
import { CATEGORY_COLORS, EDITABLE_CATEGORY_VALUES, normalizeCategory } from '../../constants';
import TimeRangeWheelPicker from '../common/TimeRangeWheelPicker';

interface EditViewProps {
  entry: Partial<TimeEntry>;
  onSave: (entry: TimeEntry) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  onMergePrevious?: (entry: TimeEntry) => void | Promise<void>;
  categoryOptions: CategoryType[];
  categoryColorMap?: Record<string, string>;
  openPickerOnMount?: boolean;
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(':').map(Number);
  const total = (hour * 60 + minute + minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function nowHHmm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function EditView({ entry, onSave, onCancel, onDelete, onMergePrevious, categoryOptions, categoryColorMap = {} }: EditViewProps) {
  const initialDefaults = useMemo(() => {
    const current = nowHHmm();
    return {
      start: entry.startTime || addMinutes(current, -30),
      end: entry.endTime || current,
    };
  }, [entry.startTime, entry.endTime]);

  const [category, setCategory] = useState<CategoryType>(
    (() => {
      const normalized = normalizeCategory(entry.category);
      if (categoryOptions.includes(normalized)) return normalized;
      return categoryOptions[0] || EDITABLE_CATEGORY_VALUES[0];
    })()
  );
  const [startTime, setStartTime] = useState(initialDefaults.start);
  const [endTime, setEndTime] = useState(initialDefaults.end);
  const [note, setNote] = useState(entry.note || '');

  const calculateDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
  };
  const duration = calculateDuration(startTime, endTime);

  const handleSave = () => {
    onSave({ ...entry, category, startTime, endTime, note, durationMinutes: duration } as TimeEntry);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end bg-slate-950/35 lg:items-center lg:justify-center lg:p-6">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:max-w-3xl lg:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="cursor-pointer rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100" aria-label="返回">
              <ChevronLeft size={22} className="lg:hidden" />
              <X size={20} className="hidden lg:block" />
            </button>
            <h2 className="text-xl font-bold text-slate-950">编辑记录</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">今天</span>
            {entry.id && onDelete && (
              <button onClick={() => onDelete(entry.id!)} className="cursor-pointer text-sm text-red-500" aria-label="删除">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={handleSave} className="cursor-pointer font-bold text-slate-950">
              确定
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div className="bg-slate-50 px-4 py-5 sm:px-6">
            <TimeRangeWheelPicker
              embedded
              startTime={startTime}
              endTime={endTime}
              onChange={({ startTime: nextStart, endTime: nextEnd }) => {
                setStartTime(nextStart);
                setEndTime(nextEnd);
              }}
            />
          </div>

          <div className="space-y-6 p-5">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-bold text-white">分类</span>
                <span className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-500">重要</span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => {
                    if (entry.id && onMergePrevious) {
                      onMergePrevious({ ...entry, category, startTime, endTime, note, durationMinutes: duration } as TimeEntry);
                    }
                  }}
                  disabled={!entry.id || !onMergePrevious}
                  className="flex cursor-pointer items-center gap-1 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} /> 向上合并
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-full py-2 text-sm font-medium text-white/95 transition-all ${
                      category === cat ? 'ring-2 ring-slate-400 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: categoryColorMap[cat] || CATEGORY_COLORS[cat] }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">备注</span>
                <button onClick={handleSave} className="rounded-full bg-slate-900 px-4 py-1 text-sm font-bold text-white">
                  确定
                </button>
              </div>
              <textarea
                placeholder="请输入备注，支持 Markdown 格式..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[120px] w-full resize-none rounded-xl border border-transparent bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
