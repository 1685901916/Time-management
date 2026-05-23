import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDownUp,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Save,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import MarkdownText from '../common/MarkdownText';
import PageHeader from '../common/PageHeader';
import {
  CATEGORY_COLORS,
  type CategoryType,
  getCategoryColor,
  getLocalDateString,
  normalizeCategory,
} from '../../constants';
import type { TimeEntry } from '../../types';
import { createProxyChatCompletion } from '../../api/ai';
import { getEntriesRange } from '../../api/entries';
import { getDailyReview, saveDailyReview } from '../../api/dailyReviews';

const AI_MODEL = (import.meta.env.VITE_AI_MODEL as string) || 'gpt-5-mini';

interface DailyAnalysisViewProps {
  entries: TimeEntry[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDateClick: () => void;
  onMoreClick: () => void;
  categoryOptions: CategoryType[];
  categoryColorMap?: Record<string, string>;
  goalColorMap?: Record<string, string>;
}

interface AnalysisResult {
  summary: string;
  highlights: string[];
  suggestions: string[];
  score: number;
}

type CategoryStat = {
  category: string;
  minutes: number;
};

const REVIEW_MAX = 5000;

const ACCENT = {
  fill: 'var(--color-accent-mint-fill)',
  ink: 'var(--color-accent-mint-ink)',
  ring: 'var(--color-accent-mint-ring)',
};

const ACCENT_RING_HEX = '#7EC8C4';
const ACCENT_INK_HEX = '#5C9694';

const REVIEW_TEMPLATES = [
  {
    key: 'timeline',
    label: '时间开销日记',
    content: (date: string, entries: TimeEntry[], categoryStats: CategoryStat[]) =>
      buildTimeDiary(date, entries, categoryStats),
  },
  {
    key: 'review',
    label: '日终复盘',
    content: (_date: string, entries: TimeEntry[], categoryStats: CategoryStat[]) => `【今日概览】
总记录：${formatMinutes(getTotalRecordedMinutes(entries))}
主要分类：${categoryStats[0] ? `${categoryStats[0].category} ${formatMinutes(categoryStats[0].minutes)}` : '暂无'}

【做得好的地方】
- 

【可以改进的地方】
- 

【明天最重要的一件事】
- 
`,
  },
  {
    key: 'questions',
    label: '四个问题',
    content: () => `【四个问题】
今天最满意的一件事：

今天最浪费时间的地方：

明天最重要的一件事：

接下来要避免的一个问题：
`,
  },
  {
    key: 'axis',
    label: '时间轴',
    content: (_date: string, entries: TimeEntry[]) => `【时间轴】
${entries.length > 0 ? entries.map((entry) => `${entry.startTime} - ${entry.endTime}｜${entry.category}${entry.note ? `｜${entry.note}` : ''}`).join('\n') : `06:00 -
07:00 -
08:00 -
09:00 -
10:00 -
11:00 -
12:00 -
13:00 -
14:00 -
15:00 -
16:00 -
17:00 -
18:00 -
19:00 -
20:00 -
21:00 -
22:00 -
23:00 -`}
`,
  },
  {
    key: 'overview',
    label: '概览',
    content: (_date: string, _entries: TimeEntry[], categoryStats: CategoryStat[]) => `【分类概览】
${categoryStats.length > 0 ? categoryStats.map((stat) => `- ${stat.category}：${formatMinutes(stat.minutes)}`).join('\n') : '- 暂无记录'}

【今天完成了】
- 

【需要减少的时间】
- 

【给自己一句话】
- 
`,
  },
] as const;

type ReviewTemplateKey = (typeof REVIEW_TEMPLATES)[number]['key'];

const REVIEW_TEMPLATE_CARDS: Array<{
  key: ReviewTemplateKey;
  label: string;
  icon: typeof FileText;
  accent: string;
  bg: string;
}> = [
  { key: 'timeline', label: '开销日记', icon: FileText, accent: '#475569', bg: '#F1F5F9' },
  { key: 'review', label: '日终复盘', icon: ClipboardList, accent: '#64748B', bg: '#F8FAFC' },
  { key: 'questions', label: '四个问题', icon: Sparkles, accent: '#7C3AED', bg: '#F5F3FF' },
  { key: 'axis', label: '时间轴', icon: ArrowDownUp, accent: '#2563EB', bg: '#EFF6FF' },
  { key: 'overview', label: '概览', icon: Target, accent: '#334155', bg: '#F1F5F9' },
];

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} 分钟`;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

function getCategoryStats(entries: TimeEntry[]): CategoryStat[] {
  const map: Record<string, number> = {};
  for (const entry of entries) {
    map[entry.category] = (map[entry.category] || 0) + entry.durationMinutes;
  }
  return Object.entries(map)
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

function getTotalRecordedMinutes(entries: TimeEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function getTimelineStart(entry: Pick<TimeEntry, 'startTime' | 'endTime'>) {
  const start = timeToMinutes(entry.startTime);
  const end = timeToMinutes(entry.endTime);
  return start > end ? start - 24 * 60 : start;
}

function formatEntryRange(entry: Pick<TimeEntry, 'startTime' | 'endTime'>) {
  return timeToMinutes(entry.startTime) > timeToMinutes(entry.endTime)
    ? `前一天 ${entry.startTime} - ${entry.endTime}`
    : `${entry.startTime} - ${entry.endTime}`;
}

function buildTimeDiary(date: string, entries: TimeEntry[], categoryStats: CategoryStat[]) {
  const sorted = [...entries].sort((a, b) => getTimelineStart(a) - getTimelineStart(b));

  if (sorted.length === 0) {
    return `${date}

【时间开销日记】
暂无时间记录。
`;
  }

  const lines = categoryStats.flatMap((stat) => {
    const items = sorted.filter((entry) => entry.category === stat.category || normalizeCategory(entry.category) === stat.category);
    return [
      `【${stat.category}】${formatMinutes(stat.minutes)}`,
      ...items.map((entry, index) => {
        const note = entry.note?.trim();
        return `${index + 1}. ${formatEntryRange(entry)} - ${formatMinutes(entry.durationMinutes)}${note ? `\n   记录：${note}` : ''}`;
      }),
      '',
    ];
  });

  return `${date}

【时间开销日记】
总记录：${formatMinutes(getTotalRecordedMinutes(entries))}

${lines.join('\n').trim()}
`;
}

function normalizeGeneratedReview(content: string) {
  return content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\s+分钟/g, '分钟').replace(/\s+小时/g, '小时');
}

function shiftDate(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

function formatDateLabel(dateStr: string) {
  const today = getLocalDateString();
  const yesterday = shiftDate(today, -1);
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shortDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getWeekDays(endDateStr: string, days = 7): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(`${endDateStr}T00:00:00`);
    d.setDate(d.getDate() - i);
    result.push(getLocalDateString(d));
  }
  return result;
}

function describePolarPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return ['M', start.x, start.y, 'A', r, r, 0, largeArc, 0, end.x, end.y].join(' ');
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function DonutChart({
  stats,
  total,
  size = 180,
  thickness = 22,
  categoryColorMap = {},
}: {
  stats: CategoryStat[];
  total: number;
  size?: number;
  thickness?: number;
  categoryColorMap?: Record<string, string>;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  if (total === 0) {
    return (
      <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full border-[22px] border-slate-100" />
    );
  }

  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
      {stats.map((stat) => {
        const ratio = stat.minutes / total;
        const startAngle = acc * 360;
        const endAngle = (acc + ratio) * 360;
        acc += ratio;
        if (ratio === 0) return null;
        if (ratio >= 0.999) {
          return (
            <circle
              key={stat.category}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={getCategoryColor(stat.category, categoryColorMap)}
              strokeWidth={thickness}
            />
          );
        }
        return (
          <path
            key={stat.category}
            d={describePolarPath(cx, cy, r, startAngle, endAngle)}
            fill="none"
            stroke={getCategoryColor(stat.category, categoryColorMap)}
            strokeWidth={thickness}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

type TrendBucket = { date: string; minutes: number };

function TrendBars({
  data,
  highlightDate,
  color = ACCENT_RING_HEX,
}: {
  data: TrendBucket[];
  highlightDate: string;
  color?: string;
}) {
  const max = Math.max(60, ...data.map((d) => d.minutes));
  const niceMax = Math.ceil(max / 60 / 2) * 2 * 60;
  const total = data.reduce((sum, d) => sum + d.minutes, 0);
  const avg = data.length > 0 ? total / data.length : 0;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const avgRatio = Math.min(100, (avg / niceMax) * 100);

  return (
    <div className="relative space-y-2.5">
      <div className="relative mb-3 h-7">
        <div className="absolute left-[58px] right-[78px] top-3 h-px bg-slate-100" />
        {avg > 0 && (
          <div
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `calc(58px + (100% - 136px) * ${avgRatio / 100})` }}
          >
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-slate-400 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.6)]">
              均值 {formatMinutes(Math.round(avg))}
            </span>
            <span className="mt-1 h-2 w-px" style={{ backgroundColor: color }} />
          </div>
        )}
      </div>
      <div className="space-y-2.5">
        {data.map((bucket, idx) => {
          const isActive = bucket.date === highlightDate;
          const ratio = Math.min(100, (bucket.minutes / niceMax) * 100);
          const isHovered = hoverIdx === idx;
          return (
            <div
              key={bucket.date}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className={`grid grid-cols-[48px_minmax(0,1fr)_68px] items-center gap-2 rounded-2xl px-2 py-1.5 transition-all ${
                isActive ? 'bg-white shadow-[0_12px_34px_-28px_rgba(15,23,42,0.7)]' : 'hover:bg-white/70'
              }`}
            >
              <span className={`text-xs font-extrabold number-font ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                {shortDateLabel(bucket.date)}
              </span>
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(bucket.minutes > 0 ? 5 : 0, ratio)}%`,
                    backgroundColor: color,
                    opacity: bucket.minutes > 0 ? (isActive || isHovered ? 0.95 : 0.42) : 0,
                  }}
                />
              </div>
              <span className={`text-right text-[11px] font-extrabold number-font ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                {bucket.minutes > 0 ? formatMinutes(bucket.minutes) : '0 分钟'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DailyAnalysisView({
  entries,
  selectedDate,
  onDateChange,
  onDateClick,
  categoryOptions,
  categoryColorMap = {},
  goalColorMap = {},
}: DailyAnalysisViewProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewRollbackContent, setReviewRollbackContent] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<(typeof REVIEW_TEMPLATES)[number]['key']>('timeline');
  const [rangeEntries, setRangeEntries] = useState<TimeEntry[]>([]);
  const [trendDays, setTrendDays] = useState<string[]>([]);
  const [trendCategory, setTrendCategory] = useState<CategoryType | 'all'>('all');
  const [exportFlash, setExportFlash] = useState(false);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => getTimelineStart(a) - getTimelineStart(b)),
    [entries]
  );
  const categoryStats = useMemo(() => getCategoryStats(entries), [entries]);
  const totalMinutes = useMemo(() => getTotalRecordedMinutes(entries), [entries]);
  const topCategory = categoryStats[0];
  const noteCount = useMemo(() => entries.filter((entry) => entry.note?.trim()).length, [entries]);

  const loadReview = useCallback(async () => {
    setReviewLoading(true);
    setReviewMessage('');
    try {
      const review = await getDailyReview(selectedDate);
      const content = normalizeGeneratedReview(review?.content || '');
      setReviewContent(content);
      setReviewRollbackContent(null);
      setReviewEditing(!content.trim());
    } catch {
      setReviewContent('');
      setReviewRollbackContent(null);
      setReviewEditing(true);
    } finally {
      setReviewLoading(false);
    }
  }, [selectedDate]);

  const loadTrend = useCallback(async () => {
    const days = getWeekDays(selectedDate, 7);
    setTrendDays(days);
    try {
      const fetched = await getEntriesRange(days[0], days[days.length - 1]);
      setRangeEntries(fetched);
    } catch {
      setRangeEntries([]);
    }
  }, [selectedDate]);

  const trend = useMemo<TrendBucket[]>(() => {
    if (trendDays.length === 0) return [];
    const map: Record<string, number> = {};
    for (const day of trendDays) map[day] = 0;
    for (const entry of rangeEntries) {
      if (entry.isArchived) continue;
      if (trendCategory !== 'all' && entry.category !== trendCategory && normalizeCategory(entry.category) !== trendCategory) continue;
      if (map[entry.date] !== undefined) {
        map[entry.date] += entry.durationMinutes;
      }
    }
    return trendDays.map((date) => ({ date, minutes: map[date] || 0 }));
  }, [rangeEntries, trendDays, trendCategory]);

  const trendSummary = useMemo(() => {
    const todayMinutes = trend.find((bucket) => bucket.date === selectedDate)?.minutes || 0;
    const activeDays = trend.filter((bucket) => bucket.minutes > 0).length;
    const total = trend.reduce((sum, bucket) => sum + bucket.minutes, 0);
    const average = trend.length > 0 ? Math.round(total / trend.length) : 0;
    const peak = trend.reduce<TrendBucket | null>(
      (current, bucket) => (!current || bucket.minutes > current.minutes ? bucket : current),
      null
    );

    return {
      todayMinutes,
      activeDays,
      average,
      peak,
    };
  }, [selectedDate, trend]);

  const trendColor = trendCategory === 'all' ? ACCENT_RING_HEX : getCategoryColor(trendCategory, categoryColorMap);

  const trendCategoryOptions = useMemo<(CategoryType | 'all')[]>(() => {
    const options: (CategoryType | 'all')[] = [
      'all',
      ...categoryOptions.filter((category) => category !== '未记录'),
    ];

    return options;
  }, [categoryOptions]);

  useEffect(() => {
    if (trendCategory !== 'all' && !trendCategoryOptions.includes(trendCategory)) {
      setTrendCategory('all');
    }
  }, [trendCategory, trendCategoryOptions]);

  useEffect(() => {
    setAnalysis(null);
    setError('');
    loadReview();
    loadTrend();
  }, [selectedDate, loadReview, loadTrend]);

  const selectedTemplateContent = useMemo(() => {
    const template = REVIEW_TEMPLATES.find((item) => item.key === selectedTemplate);
    if (!template) return '';
    return normalizeGeneratedReview(template.content(selectedDate, sortedEntries, categoryStats));
  }, [selectedTemplate, selectedDate, sortedEntries, categoryStats]);

  const selectedTemplateCard =
    REVIEW_TEMPLATE_CARDS.find((card) => card.key === selectedTemplate) || REVIEW_TEMPLATE_CARDS[0];

  const handleApplyTemplate = useCallback(() => {
    if (reviewContent.trim() && !window.confirm('当前已有内容，使用模板将替换现有内容，是否继续？')) {
      return;
    }
    setReviewRollbackContent(reviewContent);
    setReviewContent(selectedTemplateContent);
    setReviewEditing(true);
    setReviewMessage('');
  }, [reviewContent, selectedTemplateContent]);

  const handleRollbackTemplate = useCallback(() => {
    if (reviewRollbackContent === null) {
      setReviewEditing(false);
      return;
    }
    setReviewContent(reviewRollbackContent);
    setReviewRollbackContent(null);
    setReviewEditing(true);
    setReviewMessage('');
  }, [reviewRollbackContent]);

  const handleSaveReview = useCallback(async () => {
    setReviewSaving(true);
    setReviewMessage('');
    try {
      await saveDailyReview(selectedDate, reviewContent);
      setReviewRollbackContent(null);
      setReviewMessage('已保存');
    } catch (saveError: any) {
      setReviewMessage(saveError?.response?.data?.error || saveError?.message || '保存失败');
    } finally {
      setReviewSaving(false);
    }
  }, [reviewContent, selectedDate]);

  const runAnalysis = useCallback(async () => {
    if (entries.length === 0) return;

    setAnalyzing(true);
    setError('');
    setAnalysis(null);

    const entrySummary = sortedEntries
      .map((entry) => `${entry.startTime}-${entry.endTime} ${entry.category}${entry.note ? `：${entry.note}` : ''}（${entry.durationMinutes} 分钟）`)
      .join('\n');

    const statsText = categoryStats.map((stat) => `${stat.category}：${formatMinutes(stat.minutes)}`).join('；');

    const prompt = `你是一名时间管理教练，请基于下面这一天的记录给出简洁、真实、可执行的中文分析。

日期：${selectedDate}
时间记录：
${entrySummary}

分类统计：${statsText}
总记录时长：${formatMinutes(totalMinutes)}

请只返回 JSON，不要输出 markdown，不要输出代码块：
{
  "summary": "用 1 到 2 句话总结今天的整体状态",
  "highlights": ["2 到 3 条今天做得好的地方"],
  "suggestions": ["2 到 3 条明天可执行的建议"],
  "score": 1 到 100 的整数
}`;

    try {
      const response = await createProxyChatCompletion({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      });

      const text = response.choices?.[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        setAnalysis(JSON.parse(match[0]));
      } else {
        setAnalysis({ summary: text, highlights: [], suggestions: [], score: 0 });
      }
    } catch (analysisError: any) {
      setError(analysisError?.response?.data?.error || analysisError?.message || 'AI 分析失败，请检查 API 配置');
    } finally {
      setAnalyzing(false);
    }
  }, [entries, sortedEntries, categoryStats, totalMinutes, selectedDate]);

  const handleExport = useCallback(() => {
    const lines: string[] = [];
    lines.push(`# 总结分析 ${selectedDate}`);
    lines.push('');
    lines.push(`总记录：${formatMinutes(totalMinutes)}`);
    lines.push(`记录条数：${entries.length}（${noteCount} 条备注）`);
    if (topCategory) {
      const percent = totalMinutes > 0 ? Math.round((topCategory.minutes / totalMinutes) * 100) : 0;
      lines.push(`主要去向：${topCategory.category} ${percent}%（${formatMinutes(topCategory.minutes)}）`);
    }
    lines.push('');
    if (categoryStats.length > 0) {
      lines.push('## 分类');
      for (const stat of categoryStats) {
        const percent = totalMinutes > 0 ? Math.round((stat.minutes / totalMinutes) * 100) : 0;
        lines.push(`- ${stat.category}：${formatMinutes(stat.minutes)} · ${percent}%`);
      }
      lines.push('');
    }
    if (sortedEntries.length > 0) {
      lines.push('## 时间线');
      for (const entry of sortedEntries) {
        lines.push(`- ${formatEntryRange(entry)} · ${entry.category} · ${formatMinutes(entry.durationMinutes)}`);
        if (entry.note?.trim()) lines.push(`  ${entry.note.trim()}`);
      }
      lines.push('');
    }
    if (reviewContent.trim()) {
      lines.push('## 复盘');
      lines.push(reviewContent.trim());
      lines.push('');
    }
    if (analysis) {
      lines.push('## AI 分析');
      lines.push(analysis.summary);
      if (analysis.highlights.length > 0) {
        lines.push('');
        lines.push('### 做得好的地方');
        analysis.highlights.forEach((item) => lines.push(`- ${item}`));
      }
      if (analysis.suggestions.length > 0) {
        lines.push('');
        lines.push('### 明天的建议');
        analysis.suggestions.forEach((item) => lines.push(`- ${item}`));
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `分析报告-${selectedDate}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 1500);
  }, [analysis, categoryStats, entries.length, noteCount, reviewContent, selectedDate, sortedEntries, topCategory, totalMinutes]);

  const isToday = selectedDate === getLocalDateString();
  const topPercent = topCategory && totalMinutes > 0 ? Math.round((topCategory.minutes / totalMinutes) * 100) : 0;
  const reviewLength = reviewContent.length;
  const reviewFilled = reviewContent.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 lg:pb-12">
      <PageHeader
        title="总结分析"
        actions={
          <>
            <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)]">
              <button
                onClick={() => onDateChange(shiftDate(selectedDate, -1))}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-950"
                aria-label="前一天"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={onDateClick}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50"
              >
                <span className="text-sm font-extrabold text-slate-950">{formatDateLabel(selectedDate)}</span>
                <span className="hidden text-xs font-bold text-slate-400 sm:block">{selectedDate}</span>
              </button>
              <button
                onClick={() => !isToday && onDateChange(shiftDate(selectedDate, 1))}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  isToday ? 'text-slate-200' : 'cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-950'
                }`}
                aria-label="后一天"
                disabled={isToday}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={handleExport}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)] transition-colors hover:bg-slate-50"
            >
              <Download size={16} />
              <span className="hidden sm:inline">{exportFlash ? '已导出' : '导出报告'}</span>
            </button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[1280px] space-y-5 px-5 py-6 lg:px-8">
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          <KpiCard
            label="总记录"
            value={formatMinutes(totalMinutes)}
            hint={`${entries.length} 条 · ${noteCount} 备注`}
            icon={<FileText size={18} />}
          />
          <KpiCard
            label="主要去向"
            value={topCategory ? `${topCategory.category} ${topPercent}%` : '暂无'}
            hint={topCategory ? formatMinutes(topCategory.minutes) : '记录后自动统计'}
            icon={<Target size={18} />}
          />
          <KpiCard
            label="复盘状态"
            value={reviewFilled ? '已记录' : '未填写'}
            hint={reviewFilled ? '可继续修订' : '用模板生成'}
            icon={<ClipboardList size={18} />}
          />
        </section>

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <article className="minimal-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between sm:mb-5">
              <span className="suite-title text-[15px]">时间分布</span>
              {topCategory && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{ background: ACCENT.fill, color: ACCENT.ink }}
                >
                  共 {categoryStats.length} 类
                </span>
              )}
            </div>

            {totalMinutes === 0 ? (
              <DistributionEmpty />
            ) : (
              <div className="grid items-center gap-4 sm:gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
                <div className="relative mx-auto h-[160px] w-[160px] sm:h-[180px] sm:w-[180px]">
                  <DonutChart stats={categoryStats} total={totalMinutes} categoryColorMap={categoryColorMap} />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">总计</span>
                    <span className="mt-1 text-lg font-extrabold text-slate-950">{formatMinutes(totalMinutes)}</span>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {categoryStats.slice(0, 5).map((stat) => {
                    const percent = Math.round((stat.minutes / totalMinutes) * 100);
                    return (
                      <li key={stat.category} className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: getCategoryColor(stat.category, categoryColorMap) }}
                        />
                        <span className="w-16 shrink-0 truncate text-sm font-extrabold text-slate-950">
                          {stat.category}
                        </span>
                        <span className="flex-1 truncate text-xs font-bold text-slate-400">
                          {formatMinutes(stat.minutes)}
                        </span>
                        <span className="w-10 shrink-0 text-right text-sm font-extrabold text-slate-950 number-font">
                          {percent}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </article>

          <article
            className="min-w-0 overflow-hidden rounded-[24px] border shadow-[0_22px_60px_-52px_rgba(15,23,42,0.5)]"
            style={{
              background: `linear-gradient(135deg, ${trendColor}24 0%, ${trendColor}10 42%, #FFFFFF 100%)`,
              borderColor: `${trendColor}2E`,
            }}
          >
            <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
                  style={{ backgroundColor: `${trendColor}20` }}
                >
                  <TrendingUp size={17} style={{ color: trendColor }} />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-slate-950 sm:text-[15px]">趋势分布</h3>
                  <p className="text-[11px] font-bold text-slate-400">
                    {trendCategory === 'all' ? '全部分类' : trendCategory} · 近 7 天
                  </p>
                </div>
              </div>
              <div className="hidden grid-cols-3 gap-1.5 sm:grid">
                <div className="rounded-2xl bg-white/75 px-3 py-2 text-right shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: trendColor }}>今日</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950 number-font">{formatMinutes(trendSummary.todayMinutes)}</p>
                </div>
                <div className="rounded-2xl bg-white/75 px-3 py-2 text-right shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: trendColor }}>活跃</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950 number-font">{trendSummary.activeDays} 天</p>
                </div>
                <div className="rounded-2xl bg-white/75 px-3 py-2 text-right shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: trendColor }}>峰值</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-950 number-font">
                    {trendSummary.peak ? formatMinutes(trendSummary.peak.minutes) : '0 分钟'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="mx-4 mb-4 min-w-0 rounded-2xl p-1 pb-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] sm:mx-6"
              style={{ backgroundColor: `${trendColor}1F` }}
            >
              <div className="flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain pb-1 pr-4">
              {trendCategoryOptions.map((option) => {
                const isActive = trendCategory === option;
                const label = option === 'all' ? '全部' : option;
                const optionColor = option === 'all' ? ACCENT_RING_HEX : getCategoryColor(option, categoryColorMap);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTrendCategory(option)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-all sm:text-xs"
                    style={
                      isActive
                        ? { backgroundColor: optionColor, color: '#FFFFFF', boxShadow: `0 10px 24px -18px ${optionColor}` }
                        : { color: '#64748B' }
                    }
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: isActive ? '#FFFFFF' : optionColor }}
                    />
                    {label}
                  </button>
                );
              })}
              </div>
            </div>

            <div className="border-t border-white/60 bg-white/50 px-3 pb-4 pt-2 sm:px-5 sm:pb-5">
              <TrendBars data={trend} highlightDate={selectedDate} color={trendColor} />
            </div>
          </article>
        </section>

        <section className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3 sm:space-y-4">
            <article className="minimal-card p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="suite-title text-[15px]">时间线</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  按实际时间顺序
                  <ArrowDownUp size={13} />
                </span>
              </div>

              {sortedEntries.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
                  当天没有记录
                </p>
              ) : (
                <ul className="space-y-4">
                  {sortedEntries.map((entry, idx) => {
                    const color =
                      (entry.linkedGoalId && goalColorMap[entry.linkedGoalId]) ||
                      getCategoryColor(entry.category, categoryColorMap) ||
                      '#CBD5E1';
                    return (
                      <li key={entry.id} className="relative flex gap-3.5">
                        <div className="flex flex-col items-center pt-1.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white"
                            style={{ background: color }}
                          />
                          {idx < sortedEntries.length - 1 && (
                            <span className="mt-1 w-px flex-1 bg-slate-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-[15px] font-extrabold text-slate-950">
                              {formatEntryRange(entry)}
                            </span>
                            <span className="text-xs font-extrabold text-slate-400">
                              {formatMinutes(entry.durationMinutes)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-extrabold text-slate-950">{entry.category}</p>
                          {entry.note?.trim() ? (
                            <MarkdownText
                              text={entry.note}
                              className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500"
                            />
                          ) : (
                            <p className="mt-1 text-xs font-bold text-slate-300">没有备注</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            <article className="minimal-card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11"
                  style={{ background: ACCENT.fill, color: ACCENT.ink }}
                >
                  <Sparkles size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-slate-950">AI 分析</p>
                  <p className="text-xs font-bold text-slate-500">
                    基于当天记录生成 AI 分析，帮你发现模式与改进建议
                  </p>
                </div>
                <button
                  onClick={runAnalysis}
                  disabled={analyzing || entries.length === 0}
                  className="suite-primary-button flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs"
                >
                  {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {analyzing ? '分析中…' : analysis ? '重新分析' : '生成分析'}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500"
                  >
                    {error}
                  </motion.p>
                )}

                {analysis && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]"
                  >
                    {analysis.score > 0 && (
                      <div className="suite-tile flex flex-col items-center justify-center p-3">
                        <div className="relative h-14 w-14">
                          <svg viewBox="0 0 36 36" className="h-14 w-14 rotate-[-90deg]">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15.5"
                              fill="none"
                              stroke={
                                analysis.score >= 70 ? ACCENT_RING_HEX : analysis.score >= 40 ? '#F59E0B' : '#EF4444'
                              }
                              strokeWidth="3"
                              strokeDasharray={`${analysis.score * 0.974} 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-slate-950">
                            {analysis.score}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          Score
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="rounded-2xl bg-slate-50 p-3.5 text-sm font-semibold leading-6 text-slate-700">
                        {analysis.summary}
                      </p>
                      {analysis.highlights.length > 0 && (
                        <div>
                          <p className="ui-label mb-1.5">做得好的地方</p>
                          <div className="space-y-1.5">
                            {analysis.highlights.map((item, index) => (
                              <p key={index} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                                {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.suggestions.length > 0 && (
                        <div>
                          <p className="ui-label mb-1.5" style={{ color: ACCENT.ink }}>
                            明天的建议
                          </p>
                          <div className="space-y-1.5">
                            {analysis.suggestions.map((item, index) => (
                              <p
                                key={index}
                                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                                style={{ background: ACCENT.fill }}
                              >
                                {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          </div>

          <article
            className="overflow-hidden rounded-[24px] border shadow-[0_22px_60px_-52px_rgba(15,23,42,0.5)]"
            style={{
              background: `linear-gradient(145deg, ${selectedTemplateCard.bg} 0%, #FFFFFF 44%, #F8FAFC 100%)`,
              borderColor: `${selectedTemplateCard.accent}18`,
            }}
          >
            <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: selectedTemplateCard.bg, color: selectedTemplateCard.accent }}
                >
                  <BookOpen size={17} />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-slate-950 sm:text-[15px]">复盘笔记</h3>
                  <p className="text-[11px] font-bold text-slate-400">
                    当前：{selectedTemplateCard.label} · {reviewEditing ? '编辑中' : '预览中'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRollbackTemplate}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-extrabold text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 sm:text-xs"
                  disabled={reviewRollbackContent === null && reviewEditing}
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  disabled={reviewLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-3.5 py-2 text-[11px] font-extrabold text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.9)] transition-colors hover:bg-slate-800 disabled:opacity-50 sm:text-xs"
                >
                  <Save size={12} />
                  填充模板
                </button>
              </div>
            </div>

            <div
              className="mx-4 mb-4 overflow-hidden rounded-2xl p-1 sm:mx-6"
              style={{ backgroundColor: `${selectedTemplateCard.accent}10` }}
            >
              <div className="hide-scrollbar flex gap-1 overflow-x-auto">
                {REVIEW_TEMPLATE_CARDS.map((card) => {
                  const isActive = selectedTemplate === card.key;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => setSelectedTemplate(card.key)}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-all sm:text-xs ${
                        isActive
                          ? 'text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.9)]'
                          : 'text-slate-500 hover:bg-white/60'
                      }`}
                      style={isActive ? { backgroundColor: card.accent } : undefined}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: isActive ? card.bg : '#FFFFFF',
                          color: isActive ? card.accent : card.accent,
                        }}
                      >
                        <card.icon size={12} />
                      </span>
                      {card.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pb-4 sm:px-6 sm:pb-5">
              <div className="relative">
                {reviewEditing ? (
                  <textarea
                    value={reviewContent}
                    maxLength={REVIEW_MAX}
                    onChange={(event) => {
                      setReviewContent(event.target.value);
                      setReviewMessage('');
                    }}
                    placeholder={
                      reviewLoading
                        ? '加载中…'
                        : '写下今天的复盘。支持 Markdown：标题、列表、加粗都可以…'
                    }
                    className="min-h-[220px] w-full resize-none rounded-3xl border border-slate-100 bg-slate-50/60 p-4 text-sm font-semibold leading-7 text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100 lg:min-h-[300px]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setReviewEditing(true)}
                    className="min-h-[220px] w-full cursor-text rounded-3xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-colors hover:bg-slate-50 lg:min-h-[300px]"
                  >
                    {reviewContent.trim() ? (
                      <MarkdownText
                        text={reviewContent}
                        className="text-sm font-semibold leading-7 text-slate-700"
                      />
                    ) : (
                      <span className="text-sm font-medium leading-7 text-slate-300">
                        点击上方模板生成结构，或点击这里直接开始写…
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <p
                  className={`text-[11px] font-bold ${
                    reviewMessage === '已保存' ? 'text-emerald-500' : reviewMessage ? 'text-red-400' : 'text-transparent'
                  }`}
                >
                  {reviewMessage || '占位'}
                </p>
                <p className="text-[11px] font-bold text-slate-300 number-font">
                  {reviewLength} / {REVIEW_MAX}
                </p>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveReview}
                  disabled={reviewSaving || reviewLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-[11px] font-extrabold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50 sm:text-xs"
                >
                  {reviewSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {reviewSaving ? '保存中…' : '保存复盘'}
                </button>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="minimal-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between sm:block">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 sm:text-[12px] sm:tracking-[0.18em]">{label}</p>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:hidden"
            style={{ background: ACCENT.fill, color: ACCENT.ink }}
          >
            {icon}
          </div>
        </div>
        <p className="mt-1 text-[18px] font-extrabold leading-tight text-slate-950 sm:mt-2 sm:text-[26px]">{value}</p>
        <p className="mt-1 text-[10px] font-bold text-slate-500 sm:mt-1.5 sm:text-xs">{hint}</p>
      </div>
      <div
        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:flex"
        style={{ background: ACCENT.fill, color: ACCENT.ink }}
      >
        {icon}
      </div>
    </div>
  );
}

function DistributionEmpty() {
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="mx-auto flex h-[180px] w-[180px] items-center justify-center rounded-full border-[22px] border-slate-100 text-xs font-bold text-slate-400">
        无记录
      </div>
      <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
        当天没有记录，先去添加几段时间。
      </p>
    </div>
  );
}
