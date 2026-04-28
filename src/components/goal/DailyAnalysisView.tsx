import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Save,
} from 'lucide-react';
import Header from '../common/Header';
import MarkdownText from '../common/MarkdownText';
import { CATEGORY_COLORS, type CategoryType, getLocalDateString, normalizeCategory } from '../../constants';
import type { TimeEntry } from '../../types';
import { createProxyChatCompletion } from '../../api/ai';
import { getDailyReview, saveDailyReview } from '../../api/dailyReviews';

interface DailyAnalysisViewProps {
  entries: TimeEntry[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDateClick: () => void;
  onMoreClick: () => void;
}

interface AnalysisResult {
  summary: string;
  highlights: string[];
  suggestions: string[];
  score: number;
}

type CategoryStat = {
  category: CategoryType;
  minutes: number;
};

const REVIEW_TEMPLATES = [
  {
    key: 'timeline',
    label: '时间开销日记',
    content: (date: string, entries: TimeEntry[], categoryStats: CategoryStat[]) => buildTimeDiary(date, entries, categoryStats),
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
    .map(([category, minutes]) => ({ category: normalizeCategory(category), minutes }))
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
    const items = sorted.filter((entry) => normalizeCategory(entry.category) === stat.category);
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

export default function DailyAnalysisView({
  entries,
  selectedDate,
  onDateChange,
  onDateClick,
  onMoreClick,
}: DailyAnalysisViewProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewEditing, setReviewEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof REVIEW_TEMPLATES)[number]['key']>('timeline');

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
      setReviewEditing(!content.trim());
    } catch {
      setReviewContent('');
      setReviewEditing(true);
    } finally {
      setReviewLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setAnalysis(null);
    setError('');
    loadReview();
  }, [selectedDate, loadReview]);

  const handleInsertTemplate = useCallback(
    (templateKey: (typeof REVIEW_TEMPLATES)[number]['key']) => {
      const template = REVIEW_TEMPLATES.find((item) => item.key === templateKey);
      if (!template) return;
      const block = normalizeGeneratedReview(template.content(selectedDate, sortedEntries, categoryStats));
      setSelectedTemplate(templateKey);
      setReviewMessage('');
      setReviewContent((previous) => (previous.trim() ? `${previous.trim()}\n\n${block}` : block));
      setReviewEditing(false);
    },
    [categoryStats, selectedDate, sortedEntries]
  );

  const handleSaveReview = useCallback(async () => {
    setReviewSaving(true);
    setReviewMessage('');
    try {
      await saveDailyReview(selectedDate, reviewContent);
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
        model: 'gpt-4o-mini',
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

  const isToday = selectedDate === getLocalDateString();

  return (
    <div className="pb-20">
      <Header title="总结分析" leftIcon={<Brain size={22} />} onMoreClick={onMoreClick} />

      <div className="flex items-center justify-center gap-4 border-b border-gray-100 bg-white py-3">
        <button onClick={() => onDateChange(shiftDate(selectedDate, -1))} className="rounded-full p-1.5 hover:bg-gray-100 active:bg-gray-200">
          <ChevronLeft size={20} className="text-gray-500" />
        </button>

        <button onClick={onDateClick} className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Calendar size={16} className="text-[#5B8FF9]" />
          <span className="font-semibold text-gray-700">{formatDateLabel(selectedDate)}</span>
          <span className="text-xs text-gray-400">{selectedDate}</span>
        </button>

        <button
          onClick={() => !isToday && onDateChange(shiftDate(selectedDate, 1))}
          className={`rounded-full p-1.5 ${isToday ? 'opacity-30' : 'hover:bg-gray-100 active:bg-gray-200'}`}
        >
          <ChevronRight size={20} className="text-gray-500" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium">当天没有记录</p>
          <p className="mt-1 text-sm">先记录一些时间内容，再来生成总结。</p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-4 px-5 py-5 lg:px-8">
          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
              <div>
                <p className="text-xs font-semibold text-slate-400">总记录</p>
                <div className="mt-1 text-[28px] font-semibold tracking-tight text-slate-800">{formatMinutes(totalMinutes)}</div>
                <p className="mt-1 text-sm text-slate-500">{sortedEntries.length} 条记录 · {noteCount} 条有备注</p>
              </div>
              <div className="border-slate-100 lg:border-l lg:pl-5">
                <p className="text-xs font-semibold text-slate-400">主要去向</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[topCategory.category] }} />
                  <span className="text-xl font-semibold text-slate-800">{topCategory.category}</span>
                  <span className="text-sm font-medium text-slate-400">{Math.round((topCategory.minutes / totalMinutes) * 100)}%</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{formatMinutes(topCategory.minutes)}</p>
              </div>
              <div className="border-slate-100 lg:border-l lg:pl-5">
                <p className="text-xs font-semibold text-slate-400">复盘状态</p>
                <div className="mt-2 text-xl font-semibold text-slate-800">{reviewContent.trim() ? '已记录' : '未填写'}</div>
                <p className="mt-1 text-sm text-slate-500">用模板生成后再手动修正。</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.98fr)_minmax(480px,1.02fr)]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-600" />
                    <span className="font-semibold text-slate-800">分类概览</span>
                  </div>
                  <span className="text-sm font-bold text-slate-500">{formatMinutes(totalMinutes)}</span>
                </div>

                <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
                  {categoryStats.map((stat) => (
                    <div
                      key={stat.category}
                      title={`${stat.category}: ${formatMinutes(stat.minutes)}`}
                      style={{ width: `${(stat.minutes / totalMinutes) * 100}%`, backgroundColor: CATEGORY_COLORS[stat.category] }}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  {categoryStats.map((stat) => {
                    const percent = Math.round((stat.minutes / totalMinutes) * 100);
                    return (
                      <div key={stat.category} className="grid grid-cols-[12px_86px_minmax(0,1fr)_92px_44px] items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[stat.category] }} />
                        <span className="min-w-0 font-semibold text-slate-700">{stat.category}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: CATEGORY_COLORS[stat.category] }} />
                        </div>
                        <span className="text-right text-sm font-semibold text-slate-500">{formatMinutes(stat.minutes)}</span>
                        <span className="text-right text-xs font-bold text-slate-400">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    <span className="font-semibold text-slate-800">时间线</span>
                  </div>
                  <span className="text-xs text-slate-400">按实际时间顺序</span>
                </div>

                <div className="space-y-2">
                  {sortedEntries.map((entry) => {
                    const color = CATEGORY_COLORS[normalizeCategory(entry.category)] || '#CBD5E1';
                    return (
                      <div key={entry.id} className="grid grid-cols-[136px_minmax(0,1fr)] gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-800">{formatEntryRange(entry)}</p>
                          <p className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{formatMinutes(entry.durationMinutes)}</p>
                        </div>
                        <div className="min-w-0 border-l border-slate-100 pl-4">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-slate-800">{entry.category}</span>
                          </div>
                          {entry.note ? (
                            <MarkdownText text={entry.note} className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500" />
                          ) : (
                            <p className="mt-1 text-sm text-slate-300">没有备注</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-slate-600" />
                    <span className="font-semibold text-slate-800">复盘模板</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewEditing((value) => !value)}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      {reviewEditing ? '预览' : '编辑'}
                    </button>
                    <button
                      onClick={handleSaveReview}
                      disabled={reviewSaving || reviewLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-500 active:scale-95 disabled:opacity-50"
                    >
                      {reviewSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {reviewSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {REVIEW_TEMPLATES.map((template) => (
                    <button
                      key={template.key}
                      onClick={() => handleInsertTemplate(template.key)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                        selectedTemplate === template.key ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>

                {reviewEditing ? (
                  <textarea
                    value={reviewContent}
                    onChange={(event) => {
                      setReviewContent(event.target.value);
                      setReviewMessage('');
                    }}
                    placeholder={reviewLoading ? '加载中...' : '支持 Markdown：加粗、列表、标题。点击上方模板插入后可继续编辑。'}
                    className="min-h-[420px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-[15px] font-medium leading-8 text-slate-600 outline-none transition-colors placeholder:font-medium placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setReviewEditing(true)}
                    className="min-h-[420px] w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
                  >
                    {reviewContent.trim() ? (
                      <MarkdownText text={reviewContent} className="text-[15px] font-medium leading-8 text-slate-600" />
                    ) : (
                      <span className="text-[15px] font-medium leading-8 text-slate-400">
                        支持 Markdown：加粗、列表、标题。点击上方模板插入，或点击这里开始编辑。
                      </span>
                    )}
                  </button>
                )}

                {reviewMessage && (
                  <p className={`mt-2 text-xs ${reviewMessage === '已保存' ? 'text-green-600' : 'text-red-500'}`}>{reviewMessage}</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain size={18} className="text-slate-600" />
                    <span className="font-semibold text-slate-800">AI 分析</span>
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-slate-500 active:scale-95 disabled:opacity-50"
                  >
                    {analyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {analyzing ? '分析中...' : analysis ? '重新分析' : '生成分析'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-500"
                >
                  {error}
                </motion.div>
              )}

              {analysis && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {analysis.score > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14">
                        <svg viewBox="0 0 36 36" className="h-14 w-14 rotate-[-90deg]">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke={analysis.score >= 70 ? '#22C55E' : analysis.score >= 40 ? '#F59E0B' : '#EF4444'}
                            strokeWidth="3"
                            strokeDasharray={`${analysis.score * 0.974} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                          {analysis.score}
                        </span>
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-gray-600">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis.highlights.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-green-600">今天做得好的地方</p>
                      {analysis.highlights.map((item, index) => (
                        <p key={index} className="border-l-2 border-green-300 py-0.5 pl-3 text-sm text-gray-600">
                          {item}
                        </p>
                      ))}
                    </div>
                  )}

                  {analysis.suggestions.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-amber-600">明天的建议</p>
                      {analysis.suggestions.map((item, index) => (
                        <p key={index} className="border-l-2 border-amber-300 py-0.5 pl-3 text-sm text-gray-600">
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {!analysis && !error && !analyzing && (
                <p className="py-4 text-center text-sm text-gray-400">点击上方按钮，基于当天记录生成 AI 分析。</p>
              )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
