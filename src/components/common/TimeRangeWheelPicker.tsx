import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';

interface TimeRangeWheelPickerProps {
  startTime: string;
  endTime: string;
  onChange: (range: { startTime: string; endTime: string }) => void;
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
}

const ITEM_HEIGHT = 44;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function diffMinutes(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

interface WheelColumnProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  unit?: string;
}

function WheelColumn({ label, options, value, onChange, unit }: WheelColumnProps) {
  const activeIndex = Math.max(0, options.indexOf(value));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const setIndex = (index: number) => {
    const next = ((index % options.length) + options.length) % options.length;
    onChange(options[next]);
  };

  const move = (delta: number) => {
    setIndex(activeIndex + delta);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    move(event.deltaY > 0 ? 1 : -1);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerActiveRef.current = true;
    pointerStartY.current = event.clientY;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current || pointerStartY.current === null) return;
    event.preventDefault();
    const delta = event.clientY - pointerStartY.current;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
    if (Math.abs(delta) >= ITEM_HEIGHT) {
      const steps = Math.trunc(delta / ITEM_HEIGHT);
      pointerStartY.current = event.clientY - (delta - steps * ITEM_HEIGHT);
      setIndex(activeIndex - steps);
      dragOffsetRef.current = delta - steps * ITEM_HEIGHT;
      setDragOffset(dragOffsetRef.current);
    }
  };

  const handlePointerUp = () => {
    pointerActiveRef.current = false;
    pointerStartY.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  const renderRows = () => {
    const visible = [-2, -1, 0, 1, 2];
    return visible.map((offset) => {
      const idx = ((activeIndex + offset) % options.length + options.length) % options.length;
      const option = options[idx];
      const isActive = offset === 0;
      return (
        <div
          key={`${option}-${offset}`}
          className={`flex items-center justify-center font-mono transition-opacity ${
            isActive ? 'text-[22px] font-extrabold text-slate-900' : 'text-[18px] font-bold text-slate-400'
          } ${Math.abs(offset) === 2 ? 'opacity-40' : ''}`}
          style={{ height: ITEM_HEIGHT }}
        >
          {option}
          {unit && isActive && <span className="ml-0.5 text-[14px] font-bold text-slate-500">{unit}</span>}
        </div>
      );
    });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="mb-1 text-center text-[11px] font-bold text-slate-400">{label}</div>
      <div
        ref={containerRef}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={value}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            move(1);
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            move(-1);
          }
        }}
        className="relative w-full touch-none select-none overflow-hidden outline-none"
        style={{ height: ITEM_HEIGHT * 5 }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl"
          style={{ width: '88%', height: ITEM_HEIGHT, background: 'rgba(241,245,249,0.85)' }}
        />
        <div
          className="relative flex flex-col items-center"
          style={{ transform: `translateY(${dragOffset}px)`, transition: pointerActiveRef.current ? 'none' : 'transform 120ms ease-out' }}
        >
          {renderRows()}
        </div>
      </div>
    </div>
  );
}

export default function TimeRangeWheelPicker({
  startTime,
  endTime,
  onChange,
  onClose,
  className = '',
  embedded = false,
}: TimeRangeWheelPickerProps) {
  const hours = Array.from({ length: 24 }, (_, index) => pad(index));
  const minutes = Array.from({ length: 60 }, (_, index) => pad(index));

  const [sh, sm] = startTime.split(':');
  const [eh, em] = endTime.split(':');

  useEffect(() => {
    if (embedded) return;
    const previousOverflow = document.body.style.overflow;
    const prevent = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-time-range-picker]')) return;
      event.preventDefault();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', prevent, { passive: false, capture: true });
    window.addEventListener('touchmove', prevent, { passive: false, capture: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('wheel', prevent, { capture: true });
      window.removeEventListener('touchmove', prevent, { capture: true });
    };
  }, [embedded]);

  const duration = diffMinutes(startTime, endTime);
  const hh = Math.floor(duration / 60);
  const mm = duration % 60;

  const updateStart = (hour: string, minute: string) => {
    onChange({ startTime: `${hour}:${minute}`, endTime });
  };
  const updateEnd = (hour: string, minute: string) => {
    onChange({ startTime, endTime: `${hour}:${minute}` });
  };

  const containerClass = embedded
    ? `relative w-full ${className}`
    : `relative z-10 rounded-[28px] bg-white p-5 shadow-2xl ${className}`;

  return (
    <div
      data-time-range-picker
      className={containerClass}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[12px] font-bold text-slate-400">持续时长</div>
          <div className="mt-1 font-mono text-[24px] font-extrabold tracking-wide text-slate-900">
            {hh} <span className="text-[16px] text-slate-500">小时</span> {pad(mm)} <span className="text-[16px] text-slate-500">分钟</span>
          </div>
        </div>
        {!embedded && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white"
          >
            完成
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-50 px-2 py-3">
          <div className="mb-2 text-center text-[12px] font-extrabold text-slate-500">开始时间</div>
          <div className="flex">
            <WheelColumn
              label="时"
              options={hours}
              value={sh}
              unit="时"
              onChange={(next) => updateStart(next, sm)}
            />
            <WheelColumn
              label="分"
              options={minutes}
              value={sm}
              unit="分"
              onChange={(next) => updateStart(sh, next)}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-2 py-3">
          <div className="mb-2 text-center text-[12px] font-extrabold text-slate-500">结束时间</div>
          <div className="flex">
            <WheelColumn
              label="时"
              options={hours}
              value={eh}
              unit="时"
              onChange={(next) => updateEnd(next, em)}
            />
            <WheelColumn
              label="分"
              options={minutes}
              value={em}
              unit="分"
              onChange={(next) => updateEnd(eh, next)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
