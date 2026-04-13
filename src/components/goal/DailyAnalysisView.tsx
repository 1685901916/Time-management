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

const REVIEW_TEMPLATES = [
  {
    key: 'timeline',
    label: '时间开始日记',
    content: (date: string) => `${date}

【今天做了什么】
- 

【时间段回顾】
- 早上：
- 下午：
- 晚上：

【最关键的一件事】
- 
`,
  },
  {
    key: 'questions',
    label: '四个问题',
    content: () => `【总结】
今天最满意的一件事：

今天最浪费时间的地方：

明天最重要的一件事：

接下来要避免的一个问题：
`,
  },
  {
    key: 'axis',
    label: '时间轴',
    content: () => `【时间轴】
06:00 -
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
23:00 -
`,
  },
  {
    key: 'overview',
    label: '概览',
    content: () => `【学习】
今天完成了：

【运动】
今天运动情况：

【目标】
当前最重要目标：

【鼓励】
给自己一句话：
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

function getCategoryStats(entries: TimeEntry[]) {
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
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof REVIEW_TEMPLATES)[number]['key']>('timeline');

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [entries]
  );
  const categoryStats = useMemo(() => getCategoryStats(entries), [entries]);
  const totalMinutes = useMemo(() => getTotalRecordedMinutes(entries), [entries]);

  const loadReview = useCallback(async () => {
    setReviewLoading(true);
    setReviewMessage('');
    try {
      const review = await getDailyReview(selectedDate);
      setReviewContent(review?.content || '');
    } catch {
      setReviewContent('');
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
      const block = template.content(selectedDate);
      setSelectedTemplate(templateKey);
      setReviewMessage('');
      setReviewContent((previous) => (previous.trim() ? `${previous.trim()}\n\n${block}` : block));
    },
    [selectedDate]
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
        <div className="space-y-4 p-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#5B8FF9]" />
                <span className="font-semibold text-gray-700">分类概览</span>
              </div>
              <span className="text-sm text-gray-400">{formatMinutes(totalMinutes)}</span>
            </div>

            <div className="mb-3 flex h-6 overflow-hidden rounded-full">
              {categoryStats.map((stat) => (
                <div
                  key={stat.category}
                  title={`${stat.category}: ${formatMinutes(stat.minutes)}`}
                  style={{ width: `${(stat.minutes / totalMinutes) * 100}%`, backgroundColor: CATEGORY_COLORS[stat.category as CategoryType] }}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {categoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[stat.category as CategoryType] }} />
                  <span>{stat.category}</span>
                  <span className="text-gray-400">{formatMinutes(stat.minutes)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[#5B8FF9]" />
              <span className="font-semibold text-gray-700">时间线</span>
            </div>

            <div className="space-y-0">
              {sortedEntries.map((entry, index) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex w-4 shrink-0 flex-col items-center">
                    <div
                      className="mt-1.5 h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: CATEGORY_COLORS[normalizeCategory(entry.category)] || '#ccc' }}
                    />
                    {index < sortedEntries.length - 1 && (
                      <div
                        className="min-h-[24px] w-0.5 flex-1"
                        style={{ backgroundColor: CATEGORY_COLORS[normalizeCategory(entry.category)] || '#ccc', opacity: 0.3 }}
                      />
                    )}
                  </div>

                  <div className={`${index < sortedEntries.length - 1 ? 'pb-3' : ''} flex-1`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">
                        {entry.startTime}-{entry.endTime}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[normalizeCategory(entry.category)] || '#ccc' }}
                      >
                        {entry.category}
                      </span>
                      <span className="text-xs text-gray-300">{formatMinutes(entry.durationMinutes)}</span>
                    </div>
                    {entry.note && <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#6DADD1]" />
                <span className="font-semibold text-gray-700">复盘模板</span>
              </div>
              <button
                onClick={handleSaveReview}
                disabled={reviewSaving || reviewLoading}
                className="flex items-center gap-1.5 rounded-full bg-[#6DADD1] px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {reviewSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {reviewSaving ? '保存中...' : '保存'}
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {REVIEW_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  onClick={() => handleInsertTemplate(template.key)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    selectedTemplate === template.key ? 'bg-[#6DADD1] text-white' : 'bg-[#EEF5FA] text-[#5B8AA5]'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <textarea
              value={reviewContent}
              onChange={(event) => {
                setReviewContent(event.target.value);
                setReviewMessage('');
              }}
              placeholder={reviewLoading ? '加载中...' : '点击上方模板插入内容，然后编辑并保存'}
              className="min-h-[320px] w-full resize-none rounded-2xl border border-gray-200 p-4 text-sm leading-7 outline-none focus:border-[#6DADD1]"
            />

            {reviewMessage && (
              <p className={`mt-2 text-xs ${reviewMessage === '已保存' ? 'text-green-600' : 'text-red-500'}`}>{reviewMessage}</p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-500" />
                <span className="font-semibold text-gray-700">AI 分析</span>
              </div>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-50"
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
      )}
    </div>
  );
}
