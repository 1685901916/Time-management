import { type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent, useRef } from 'react';

interface TimeWheelPickerProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  className?: string;
  headerExtra?: ReactNode;
}

interface WheelColumnProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

function WheelColumn({ label, options, value, onChange }: WheelColumnProps) {
  const pointerStartY = useRef<number | null>(null);
  const activeIndex = Math.max(0, options.indexOf(value));

  const getOption = (offset: number) => options[(activeIndex + offset + options.length) % options.length];
  const formatOption = (option: string, offset: number) => {
    if (label === '小时' && value === '00' && offset === -1 && option === '23') return '前一天 23';
    return option;
  };

  const move = (delta: number) => {
    onChange(options[(activeIndex + delta + options.length) % options.length]);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    move(event.deltaY > 0 ? 1 : -1);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartY.current = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null) return;
    const deltaY = event.clientY - pointerStartY.current;
    pointerStartY.current = null;
    if (Math.abs(deltaY) < 18) return;
    move(deltaY < 0 ? 1 : -1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    }
  };

  return (
    <div>
      <div className="mb-2 text-center text-xs font-bold text-slate-400">{label}</div>
      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={value}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => event.preventDefault()}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative h-[188px] touch-none overflow-hidden rounded-3xl bg-slate-50 px-3 outline-none"
      >
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-11 -translate-y-1/2 rounded-2xl bg-white shadow-sm ring-1 ring-teal-100" />
        <div
          className="relative z-10 grid h-full grid-rows-3 items-center py-7"
        >
          {[-1, 0, 1].map((offset) => {
            const option = getOption(offset);
            return (
            <button
              key={`${option}-${offset}`}
              type="button"
              onClick={() => {
                onChange(option);
              }}
              className={`flex h-11 w-full items-center justify-center font-mono text-[22px] font-extrabold transition-colors ${
                offset === 0 ? 'text-teal-700' : 'text-slate-800'
              }`}
            >
              {formatOption(option, offset)}
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TimeWheelPicker({ title, value, onChange, onClose, className = '', headerExtra }: TimeWheelPickerProps) {
  const [hour, minute] = value.split(':');
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

  return (
    <div
      data-time-wheel-picker
      className={`relative z-10 rounded-[28px] bg-white p-5 shadow-2xl ${className}`}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onWheel={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onTouchMove={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-400">{title}</div>
          <div className="mt-1 font-mono text-[34px] font-extrabold tracking-wide text-slate-900">{value}</div>
        </div>
        <button onClick={onClose} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white">
          完成
        </button>
      </div>
      {headerExtra && <div className="mb-4">{headerExtra}</div>}
      <div className="grid grid-cols-2 gap-4">
        <WheelColumn label="小时" options={hours} value={hour} onChange={(nextHour) => onChange(`${nextHour}:${minute}`)} />
        <WheelColumn label="分钟" options={minutes} value={minute} onChange={(nextMinute) => onChange(`${hour}:${nextMinute}`)} />
      </div>
    </div>
  );
}
