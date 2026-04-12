import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Calendar, ChevronLeft, ChevronRight, Loader2, BarChart3, Clock, RefreshCw } from 'lucide-react';
import Header from '../common/Header';
import { CATEGORY_COLORS, getLocalDateString } from '../../constants';
import type { CategoryType } from '../../constants';
import type { TimeEntry } from '../../types';
import { createProxyChatCompletion } from '../../api/ai';

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

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}分钟`;
  if (min === 0) return `${h}小时`;
  return `${h}小时${min}分钟`;
}

function getCategoryStats(entries: TimeEntry[]) {
  const map: Record<string, number> = {};
  for (const e of entries) {
    map[e.category] = (map[e.category] || 0) + e.durationMinutes;
  }
  return Object.entries(map)
    .map(([category, minutes]) => ({ category: category as CategoryType, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

function getTotalRecordedMinutes(entries: TimeEntry[]) {
  return entries.reduce((sum, e) => sum + e.durationMinutes, 0);
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

function formatDateLabel(dateStr: string) {
  const today = getLocalDateString();
  const yesterday = shiftDate(today, -1);
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function DailyAnalysisView({ entries, selectedDate, onDateChange, onDateClick, onMoreClick }: DailyAnalysisViewProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const sortedEntries = [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const categoryStats = getCategoryStats(entries);
  const totalMinutes = getTotalRecordedMinutes(entries);

  const runAnalysis = useCallback(async () => {
    if (entries.length === 0) return;
    setAnalyzing(true);
    setError('');
    setAnalysis(null);

    const entrySummary = sortedEntries.map(e =>
      `${e.startTime}-${e.endTime} ${e.category}${e.note ? `: ${e.note}` : ''} (${e.durationMinutes}分钟)`
    ).join('\n');

    const statsText = categoryStats.map(s => `${s.category}: ${formatMinutes(s.minutes)}`).join(', ');

    const prompt = `你是一个时间管理分析助手。请分析以下用户在 ${selectedDate} 的时间记录，给出简洁的中文分析。

时间记录：
${entrySummary}

各类别统计：${statsText}
总记录时长：${formatMinutes(totalMinutes)}

请以JSON格式返回（不要markdown代码块，直接返回JSON）：
{
  "summary": "一段话总结今天的时间分配情况（50字以内）",
  "highlights": ["亮点1", "亮点2"],
  "suggestions": ["建议1", "建议2"],
  "score": 评分(1-100)
}`;

    try {
      const res = await createProxyChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const text = res.choices?.[0]?.message?.content || '';
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
      } else {
        setAnalysis({ summary: text, highlights: [], suggestions: [], score: 0 });
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'AI 分析失败，请检查 API 配置');
    } finally {
      setAnalyzing(false);
    }
  }, [entries, sortedEntries, categoryStats, totalMinutes, selectedDate]);

  // Reset analysis when date changes
  useEffect(() => { setAnalysis(null); setError(''); }, [selectedDate]);

  const isToday = selectedDate === getLocalDateString();

  return (
    <div className="pb-20">
      <Header
        title="每日分析"
        leftIcon={<Brain size={22} />}
        onMoreClick={onMoreClick}
      />

      {/* Date navigation */}
      <div className="flex items-center justify-center gap-4 py-3 bg-white border-b border-gray-100">
        <button onClick={() => onDateChange(shiftDate(selectedDate, -1))} className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200">
          <ChevronLeft size={20} className="text-gray-500" />
        </button>
        <button onClick={onDateClick} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50">
          <Calendar size={16} className="text-[#5B8FF9]" />
          <span className="font-semibold text-gray-700">{formatDateLabel(selectedDate)}</span>
          <span className="text-xs text-gray-400">{selectedDate}</span>
        </button>
        <button onClick={() => !isToday && onDateChange(shiftDate(selectedDate, 1))}
          className={`p-1.5 rounded-full ${isToday ? 'opacity-30' : 'hover:bg-gray-100 active:bg-gray-200'}`}>
          <ChevronRight size={20} className="text-gray-500" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock size={48} className="mb-3 opacity-50" />
          <p className="text-lg font-medium">暂无时间记录</p>
          <p className="text-sm mt-1">去「时间」页记录一些活动吧</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Category overview bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#5B8FF9]" />
                <span className="font-semibold text-gray-700">时间分布</span>
              </div>
              <span className="text-sm text-gray-400">{formatMinutes(totalMinutes)}</span>
            </div>
            {/* Stacked bar */}
            <div className="flex h-6 rounded-full overflow-hidden mb-3">
              {categoryStats.map(s => (
                <div key={s.category} title={`${s.category}: ${formatMinutes(s.minutes)}`}
                  style={{ width: `${(s.minutes / totalMinutes) * 100}%`, backgroundColor: CATEGORY_COLORS[s.category] }}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {categoryStats.map(s => (
                <div key={s.category} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CATEGORY_COLORS[s.category] }} />
                  <span>{s.category}</span>
                  <span className="text-gray-400">{formatMinutes(s.minutes)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-[#5B8FF9]" />
              <span className="font-semibold text-gray-700">时间线</span>
            </div>
            <div className="space-y-0">
              {sortedEntries.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  {/* Timeline dot & line */}
                  <div className="flex flex-col items-center w-4 shrink-0">
                    <div className="w-3 h-3 rounded-full mt-1.5 ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: CATEGORY_COLORS[entry.category as CategoryType] || '#ccc' }} />
                    {i < sortedEntries.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[24px]"
                        style={{ backgroundColor: CATEGORY_COLORS[entry.category as CategoryType] || '#ccc', opacity: 0.3 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 ${i < sortedEntries.length - 1 ? 'pb-3' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{entry.startTime}–{entry.endTime}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: CATEGORY_COLORS[entry.category as CategoryType] || '#ccc' }}>
                        {entry.category}
                      </span>
                      <span className="text-xs text-gray-300">{formatMinutes(entry.durationMinutes)}</span>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-500" />
                <span className="font-semibold text-gray-700">AI 分析</span>
              </div>
              <button onClick={runAnalysis} disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full font-medium disabled:opacity-50 active:scale-95 transition-all">
                {analyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {analyzing ? '分析中...' : (analysis ? '重新分析' : '开始分析')}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</motion.div>
              )}

              {analysis && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Score */}
                  {analysis.score > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14">
                        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none"
                            stroke={analysis.score >= 70 ? '#22C55E' : analysis.score >= 40 ? '#F59E0B' : '#EF4444'}
                            strokeWidth="3" strokeDasharray={`${analysis.score * 0.974} 100`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">{analysis.score}</span>
                      </div>
                      <p className="text-sm text-gray-600 flex-1 leading-relaxed">{analysis.summary}</p>
                    </div>
                  )}

                  {/* Highlights */}
                  {analysis.highlights.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-1.5">✦ 亮点</p>
                      {analysis.highlights.map((h, i) => (
                        <p key={i} className="text-sm text-gray-600 pl-3 py-0.5 border-l-2 border-green-300">{h}</p>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1.5">✦ 建议</p>
                      {analysis.suggestions.map((s, i) => (
                        <p key={i} className="text-sm text-gray-600 pl-3 py-0.5 border-l-2 border-amber-300">{s}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {!analysis && !error && !analyzing && (
                <p className="text-sm text-gray-400 text-center py-4">点击「开始分析」让 AI 分析你的一天</p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
