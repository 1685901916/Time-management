import { useEffect, useState } from 'react';
import { ChevronLeft, Clock, Plus, Trash2, X } from 'lucide-react';
import type { TimeEntry, CategoryType } from '../../types';
import { CATEGORY_COLORS } from '../../constants';
import TimeWheelPicker from '../common/TimeWheelPicker';

interface EditViewProps {
  entry: Partial<TimeEntry>;
  onSave: (entry: TimeEntry) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

function TimeField({
  label,
  value,
  onClick,
  active,
}: {
  label: string;
  value: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-colors ${
          active ? 'border-teal-500 bg-teal-50/40 ring-4 ring-teal-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
        }`}
      >
        <span className="font-mono text-[24px] font-semibold tracking-wide text-slate-900">{value}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500">
          <Clock size={18} />
        </span>
      </button>
    </div>
  );
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(':').map(Number);
  const total = (hour * 60 + minute + minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function TimeRangeAdjuster({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: {
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const shiftRange = (minutes: number) => {
    onStartChange(addMinutes(startTime, minutes));
    onEndChange(addMinutes(endTime, minutes));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => shiftRange(-15)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
        整段 -15分
      </button>
      <button type="button" onClick={() => shiftRange(15)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
        整段 +15分
      </button>
      <button type="button" onClick={() => onEndChange(addMinutes(endTime, -5))} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
        缩短 5分
      </button>
      <button type="button" onClick={() => onEndChange(addMinutes(endTime, 5))} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
        延长 5分
      </button>
    </div>
  );
}

export default function EditView({ entry, onSave, onCancel, onDelete }: EditViewProps) {
  const [category, setCategory] = useState<CategoryType>(entry.category || '学习');
  const [startTime, setStartTime] = useState(entry.startTime || '08:00');
  const [endTime, setEndTime] = useState(entry.endTime || '09:00');
  const [note, setNote] = useState(entry.note || '');
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(null);
  const [timeDraft, setTimeDraft] = useState('');

  const categories: CategoryType[] = ['睡觉', '学习', '运动', '刷手机', '休息', '信息工作', '户外', '写笔记', '游戏', '琐事'];
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

  const openTimeField = (field: 'start' | 'end') => {
    setActiveTimeField(field);
    setTimeDraft(field === 'start' ? startTime : endTime);
  };

  const commitTimeDraft = () => {
    if (activeTimeField === 'start') setStartTime(timeDraft);
    if (activeTimeField === 'end') setEndTime(timeDraft);
    setActiveTimeField(null);
  };

  const switchTimeField = (field: 'start' | 'end') => {
    if (activeTimeField === 'start') setStartTime(timeDraft);
    if (activeTimeField === 'end') setEndTime(timeDraft);
    setActiveTimeField(field);
    setTimeDraft(field === 'start' ? (activeTimeField === 'start' ? timeDraft : startTime) : (activeTimeField === 'end' ? timeDraft : endTime));
  };

  useEffect(() => {
    if (!activeTimeField) return;
    const previousOverflow = document.body.style.overflow;
    const preventBackgroundScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-time-wheel-picker]')) return;
      event.preventDefault();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', preventBackgroundScroll, { passive: false, capture: true });
    window.addEventListener('touchmove', preventBackgroundScroll, { passive: false, capture: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('wheel', preventBackgroundScroll, { capture: true });
      window.removeEventListener('touchmove', preventBackgroundScroll, { capture: true });
    };
  }, [activeTimeField]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end bg-slate-950/35 lg:items-center lg:justify-center lg:p-6">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:max-w-4xl lg:rounded-2xl">
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
          <div className="bg-slate-50 px-5 py-6">
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4">
              <div className="text-2xl font-semibold text-[#6DADD1]">
                {Math.floor(duration / 60)}小时{duration % 60}分钟
              </div>
              <div className="grid w-full grid-cols-2 gap-4">
                <TimeField label="开始时间" value={startTime} onClick={() => openTimeField('start')} active={activeTimeField === 'start'} />
                <TimeField label="结束时间" value={endTime} onClick={() => openTimeField('end')} active={activeTimeField === 'end'} />
              </div>
              <TimeRangeAdjuster startTime={startTime} endTime={endTime} onStartChange={setStartTime} onEndChange={setEndTime} />
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-lg bg-[#6DADD1] px-3 py-1 text-sm text-white">分类</span>
                <span className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-500">重要</span>
                <div className="flex-1" />
                <button className="flex cursor-pointer items-center gap-1 text-sm text-[#6DADD1]">
                  <Plus size={14} /> 向上合并
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-full py-2 text-sm font-medium text-white/95 transition-all ${
                      category === cat ? 'ring-2 ring-slate-400 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">备注</span>
                <button onClick={handleSave} className="rounded-full bg-[#6DADD1] px-4 py-1 text-sm text-white">
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

        {activeTimeField && (
          <div
            className="absolute inset-0 z-40 flex items-end bg-slate-950/20 lg:items-start lg:justify-center lg:pt-10"
            onWheel={(event) => event.preventDefault()}
            onTouchMove={(event) => event.preventDefault()}
          >
            <button className="absolute inset-0 cursor-default" onClick={() => setActiveTimeField(null)} aria-label="关闭时间选择" />
            <TimeWheelPicker
              title={activeTimeField === 'start' ? '选择开始时间' : '选择结束时间'}
              value={timeDraft}
              onChange={setTimeDraft}
              onClose={commitTimeDraft}
              className="w-full rounded-b-none lg:max-w-sm lg:rounded-b-[28px]"
              headerExtra={
                <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => switchTimeField('start')}
                    className={`rounded-xl py-2 text-sm font-bold ${activeTimeField === 'start' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    开始 {activeTimeField === 'start' ? timeDraft : startTime}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimeField('end')}
                    className={`rounded-xl py-2 text-sm font-bold ${activeTimeField === 'end' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    结束 {activeTimeField === 'end' ? timeDraft : endTime}
                  </button>
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
