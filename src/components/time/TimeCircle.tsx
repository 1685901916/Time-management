import React, { useMemo } from 'react';
import type { TimeEntry } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface TimeCircleProps {
  entries: TimeEntry[];
  onSelectEntry: (entry: TimeEntry | null) => void;
  selectedEntryId?: string;
  isToday: boolean;
}

export default function TimeCircle({ entries, onSelectEntry, selectedEntryId, isToday }: TimeCircleProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const center = 140;
  const outerRadius = 120;
  const middleRadius = 90;
  const innerRadius = 60;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return { x: centerX + radius * Math.cos(angleInRadians), y: centerY + radius * Math.sin(angleInRadians) };
  };

  const describeArc = (startAngle: number, endAngle: number, radius: number, innerR: number) => {
    if (endAngle - startAngle >= 359.9) endAngle = startAngle + 359.9;
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const innerStart = polarToCartesian(center, center, innerR, endAngle);
    const innerEnd = polarToCartesian(center, center, innerR, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", innerEnd.x, innerEnd.y, "A", innerR, innerR, 0, largeArcFlag, 1, innerStart.x, innerStart.y, "Z"].join(" ");
  };

  const timeToMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
  const minutesToAngle = (minutes: number) => (minutes % 720) / 720 * 360;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentAngle = minutesToAngle(currentMinutes);

  const segments = useMemo(() => {
    const segs: (TimeEntry & { segmentId: string; startMins: number; endMins: number; isPM: boolean })[] = [];
    entries.forEach(entry => {
      const startMins = timeToMinutes(entry.startTime);
      const endMins = timeToMinutes(entry.endTime);
      if (startMins < 720 && endMins > 720) {
        segs.push({ ...entry, segmentId: `${entry.id}-am`, startMins, endMins: 720, isPM: false });
        segs.push({ ...entry, segmentId: `${entry.id}-pm`, startMins: 720, endMins, isPM: true });
      } else {
        segs.push({ ...entry, segmentId: entry.id, startMins, endMins, isPM: startMins >= 720 });
      }
    });
    return segs;
  }, [entries]);

  const unrecordedSegments = useMemo(() => {
    const segs: { startMins: number; endMins: number; isPM: boolean }[] = [];
    let maxEntryEnd = 0;
    for (const e of entries) maxEntryEnd = Math.max(maxEntryEnd, timeToMinutes(e.endTime));
    const endOfDayMins = isToday ? Math.max(currentMinutes, maxEntryEnd) : 1440;
    let lastEnd = 0;
    const sorted = [...entries].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (const entry of sorted) {
      const startMins = timeToMinutes(entry.startTime);
      if (startMins > lastEnd) { const gapEnd = Math.min(startMins, endOfDayMins); if (gapEnd > lastEnd) segs.push({ startMins: lastEnd, endMins: gapEnd, isPM: lastEnd >= 720 }); }
      lastEnd = Math.max(lastEnd, timeToMinutes(entry.endTime));
    }
    if (lastEnd < endOfDayMins) segs.push({ startMins: lastEnd, endMins: endOfDayMins, isPM: lastEnd >= 720 });
    return segs;
  }, [entries, isToday, currentMinutes]);

  return (
    <div className="relative w-full flex items-center justify-center py-4">
      <svg width="280" height="280" viewBox="0 0 280 280" className="drop-shadow-sm">
        <circle cx={center} cy={center} r={outerRadius} fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
        <circle cx={center} cy={center} r={middleRadius} fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
        <circle cx={center} cy={center} r={innerRadius} fill="white" stroke="#E5E7EB" strokeWidth="1" />

        {unrecordedSegments.map((seg, i) => {
          const startAngle = minutesToAngle(seg.startMins);
          let endAngle = minutesToAngle(seg.endMins);
          if (endAngle <= startAngle && seg.endMins > seg.startMins) endAngle += 360;
          const r = seg.isPM ? outerRadius : middleRadius;
          const ir = seg.isPM ? middleRadius : innerRadius;
          return <path key={`unrec-${i}`} d={describeArc(startAngle, endAngle, r, ir)} fill="#E5E7EB" />;
        })}

        {segments.map((seg) => {
          const startAngle = minutesToAngle(seg.startMins);
          let endAngle = minutesToAngle(seg.endMins);
          if (endAngle <= startAngle && seg.endMins > seg.startMins) endAngle += 360;
          const r = seg.isPM ? outerRadius : middleRadius;
          const ir = seg.isPM ? middleRadius : innerRadius;
          const isSelected = selectedEntryId === seg.id;
          const isHovered = hoveredId === seg.id;
          return (
            <path key={seg.segmentId} d={describeArc(startAngle, endAngle, r, ir)} fill={CATEGORY_COLORS[seg.category]}
              className={`cursor-pointer transition-all duration-200 ${isSelected || isHovered ? 'opacity-100' : 'opacity-90'}`}
              onClick={(e) => { e.stopPropagation(); onSelectEntry(seg); }}
              onMouseEnter={() => setHoveredId(seg.id)} onMouseLeave={() => setHoveredId(null)} />
          );
        })}

        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * 360;
          const p1 = polarToCartesian(center, center, innerRadius, angle);
          const p2 = polarToCartesian(center, center, outerRadius, angle);
          const outerP = polarToCartesian(center, center, outerRadius + 10, angle);
          const innerP = polarToCartesian(center, center, innerRadius - 10, angle);
          return (
            <g key={i}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffffff" strokeWidth="1" className="pointer-events-none" />
              <text x={outerP.x} y={outerP.y} fill="#9CA3AF" fontSize="10" textAnchor="middle" dominantBaseline="middle">{i === 0 ? 24 : i + 12}</text>
              <text x={innerP.x} y={innerP.y} fill="#9CA3AF" fontSize="10" textAnchor="middle" dominantBaseline="middle">{i === 0 ? 12 : i}</text>
            </g>
          );
        })}

        {isToday && (
          <g transform={`rotate(${currentAngle}, ${center}, ${center})`}>
            <line x1={center} y1={center - innerRadius + 5} x2={center} y2={center - (currentMinutes >= 720 ? outerRadius : middleRadius) - 10} stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx={center} cy={center - (currentMinutes >= 720 ? outerRadius : middleRadius) - 12} r="3" fill="#EF4444" />
          </g>
        )}

        <circle cx={center} cy={center} r={innerRadius} fill="transparent" className="cursor-pointer" onClick={() => onSelectEntry(null)} />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center bg-white shadow-sm border border-gray-100">
          {selectedEntryId || hoveredId ? (
            <div className="animate-in fade-in zoom-in duration-200">
              <p className="text-[10px] text-gray-400">{(entries.find(e => e.id === (hoveredId || selectedEntryId))?.startTime)} - {(entries.find(e => e.id === (hoveredId || selectedEntryId))?.endTime)}</p>
              <p className="text-base font-bold text-gray-700 leading-tight">{entries.find(e => e.id === (hoveredId || selectedEntryId))?.category}</p>
              <p className="text-[11px] text-[#6DADD1] font-medium">{entries.find(e => e.id === (hoveredId || selectedEntryId))?.durationMinutes} 分钟</p>
            </div>
          ) : isToday ? (() => {
            const h = currentTime.getHours().toString().padStart(2, '0');
            const m = currentTime.getMinutes().toString().padStart(2, '0');
            let recordedMins = 0;
            let maxEntryEnd = 0;
            entries.forEach(e => { recordedMins += e.durationMinutes; maxEntryEnd = Math.max(maxEntryEnd, timeToMinutes(e.endTime)); });
            const unrecordedMins = Math.max(0, Math.max(currentMinutes, maxEntryEnd) - recordedMins);
            return (
              <>
                <p className="text-[10px] text-gray-400 mb-0.5">00:00~{h}:{m}</p>
                <p className="text-base font-bold text-gray-400 leading-tight">未记录</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{Math.floor(unrecordedMins / 60)}小时{unrecordedMins % 60}分钟</p>
              </>
            );
          })() : (<><p className="text-sm font-bold text-gray-400">全天</p><p className="text-xs text-gray-400 mt-1">未选中</p></>)}
        </div>
      </div>
    </div>
  );
}
