import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, ImagePlus, Save, Pencil, Maximize2, Minimize2, Bold, Italic, List, ListOrdered, Hash, Link2, CheckSquare, Target, ChevronDown } from 'lucide-react';
import type { TimeEntry, Todo, Goal } from '../../types';
import { CATEGORY_COLORS, EDITABLE_CATEGORY_VALUES, normalizeCategory, type CategoryType } from '../../constants';
import { uploadPhoto, deletePhoto } from '../../api/entries';
import PhotoThumbnail from './PhotoThumbnail';
import TimeRangeWheelPicker from '../common/TimeRangeWheelPicker';
import MarkdownText from '../common/MarkdownText';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimeEntry | null;
  onSave: (entryId: string, note: string, linkedTodoId?: string, linkedGoalId?: string) => void | Promise<void>;
  onEdit: (entry: TimeEntry) => void;
  onUpdateTime?: (entryId: string, data: Partial<Pick<TimeEntry, 'startTime' | 'endTime' | 'durationMinutes' | 'category'>>) => boolean | void | Promise<boolean | void>;
  onPhotoChange: () => void;
  todos?: Todo[];
  goals?: Goal[];
  categoryOptions?: CategoryType[];
  categoryColorMap?: Record<string, string>;
}

function calculateDuration(start: string, end: string) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export default function QuickNoteModal({ isOpen, onClose, entry, onSave, onEdit, onUpdateTime, onPhotoChange, todos = [], goals = [], categoryOptions = EDITABLE_CATEGORY_VALUES, categoryColorMap = {} }: QuickNoteModalProps) {
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<CategoryType>('学习');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [linkedTodoId, setLinkedTodoId] = useState<string | undefined>();
  const [linkedGoalId, setLinkedGoalId] = useState<string | undefined>();
  const [showTodoPicker, setShowTodoPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from entry
  useEffect(() => {
    if (entry) {
      setNote(entry.note || '');
      setCategory(normalizeCategory(entry.category));
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
      setLinkedTodoId(entry.linkedTodoId);
      setLinkedGoalId(entry.linkedGoalId);
    }
  }, [entry]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setExpanded(false);
      setShowPreview(false);
      setShowTimePicker(false);
      setShowTodoPicker(false);
      setShowGoalPicker(false);
      setShowCategoryPicker(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showTimePicker) return;
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
  }, [showTimePicker]);

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = note.substring(start, end);
    const before = note.substring(0, start);
    const after = note.substring(end);
    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setNote(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + selected.length;
    }, 0);
  }, [note]);

  if (!isOpen || !entry) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const result = await uploadPhoto(entry.id, file);
      if (result) onPhotoChange();
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    await deletePhoto(entry.id, photoId);
    onPhotoChange();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const durationMinutes = calculateDuration(startTime, endTime);
      if (
        onUpdateTime &&
        (startTime !== entry.startTime || endTime !== entry.endTime || durationMinutes !== entry.durationMinutes || category !== entry.category)
      ) {
        const updated = await onUpdateTime(entry.id, { startTime, endTime, durationMinutes, category });
        if (updated === false) return;
      }
      await onSave(entry.id, note, linkedTodoId, linkedGoalId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const linkedTodo = todos.find(t => t.id === linkedTodoId);
  const linkedGoal = goals.find(g => g.id === linkedGoalId);
  const uncompletedTodos = todos.filter(t => !t.completed && !t.isArchived);
  const durationMinutes = startTime && endTime ? calculateDuration(startTime, endTime) : entry.durationMinutes;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative z-10 flex flex-col bg-white shadow-2xl ${expanded ? 'h-full rounded-none' : 'max-h-[85vh] rounded-t-3xl'}`}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColorMap[category] || CATEGORY_COLORS[category] }} />
            <div className="min-w-0">
              <button
                onClick={() => {
                  setShowCategoryPicker(!showCategoryPicker);
                  setShowTodoPicker(false);
                  setShowGoalPicker(false);
                }}
                className="rounded-full px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-slate-100"
              >
                {category}
              </button>
              <button
                onClick={() => setShowTimePicker(true)}
                className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                title="编辑时间"
              >
                {startTime} ~ {endTime}
              </button>
              <span className="text-xs text-gray-400 ml-1">{durationMinutes}分钟</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setExpanded(!expanded)} className="p-2 bg-gray-100 rounded-full" aria-label={expanded ? '缩小' : '展开'}>
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
          </div>
        </div>

        {showCategoryPicker && (
          <div className="flex-shrink-0 border-b border-gray-50 px-5 py-3">
            <div className="grid grid-cols-5 gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                  className={`rounded-full px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95 ${
                    category === cat ? 'ring-2 ring-slate-300 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: categoryColorMap[cat] || CATEGORY_COLORS[cat] }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Linked items display */}
        {(linkedTodo || linkedGoal) && (
          <div className="px-5 py-2 flex flex-wrap gap-2 border-b border-gray-50">
            {linkedTodo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                <CheckSquare size={12} />
                {linkedTodo.title}
                <button onClick={() => setLinkedTodoId(undefined)} className="ml-1 hover:text-blue-800"><X size={10} /></button>
              </span>
            )}
            {linkedGoal && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-xs">
                <Target size={12} />
                {linkedGoal.title}
                <button onClick={() => setLinkedGoalId(undefined)} className="ml-1 hover:text-amber-800"><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* Markdown toolbar */}
        {expanded && !showPreview && (
          <div className="px-5 py-2 flex items-center gap-1 border-b border-gray-50 overflow-x-auto flex-shrink-0">
            <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded hover:bg-gray-100" title="粗体"><Bold size={16} className="text-gray-500" /></button>
            <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded hover:bg-gray-100" title="斜体"><Italic size={16} className="text-gray-500" /></button>
            <button onClick={() => insertMarkdown('# ')} className="p-1.5 rounded hover:bg-gray-100" title="标题"><Hash size={16} className="text-gray-500" /></button>
            <button onClick={() => insertMarkdown('- ')} className="p-1.5 rounded hover:bg-gray-100" title="无序列表"><List size={16} className="text-gray-500" /></button>
            <button onClick={() => insertMarkdown('1. ')} className="p-1.5 rounded hover:bg-gray-100" title="有序列表"><ListOrdered size={16} className="text-gray-500" /></button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={() => setShowPreview(true)} className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100">预览</button>
          </div>
        )}

        {/* Preview mode toggle */}
        {expanded && showPreview && (
          <div className="px-5 py-2 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
            <span className="text-xs text-gray-400">预览模式</span>
            <button onClick={() => setShowPreview(false)} className="px-2 py-1 rounded text-xs text-[#6DADD1] hover:bg-blue-50">编辑</button>
          </div>
        )}

        {/* Note input / Preview */}
        <div className={`px-5 py-4 ${expanded ? 'flex-1 overflow-y-auto' : ''}`}>
          {showPreview ? (
            <MarkdownText text={note} className="min-h-[200px] max-w-none text-sm leading-relaxed text-gray-700" />
          ) : (
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录这一刻的想法... 支持 Markdown 格式"
              className={`w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-[15px] leading-relaxed text-gray-700 outline-none resize-none placeholder-gray-400 transition-colors focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 ${expanded ? 'h-full min-h-[300px]' : 'min-h-[140px]'}`}
              autoFocus
            />
          )}
        </div>

        {/* Existing photos */}
        {entry.photos && entry.photos.length > 0 && (
          <div className="px-5 pb-3 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {entry.photos.map(photo => (
                <PhotoThumbnail key={photo.id} src={photo.filePath} onRemove={() => handleRemovePhoto(photo.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Todo picker */}
        {showTodoPicker && (
            <div className="flex-shrink-0 overflow-hidden border-t border-gray-100">
              <div className="px-5 py-3 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-gray-400 mb-2">选择关联待办</p>
                {uncompletedTodos.length === 0 ? (
                  <p className="text-xs text-gray-300 py-4 text-center">暂无待办</p>
                ) : (
                  uncompletedTodos.map(todo => (
                    <button key={todo.id} onClick={() => { setLinkedTodoId(todo.id); setShowTodoPicker(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 mb-1 transition-colors ${linkedTodoId === todo.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <CheckSquare size={14} />
                      <span className="truncate">{todo.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

        {/* Goal picker */}
        {showGoalPicker && (
            <div className="flex-shrink-0 overflow-hidden border-t border-gray-100">
              <div className="px-5 py-3 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-gray-400 mb-2">选择关联目标</p>
                {goals.length === 0 ? (
                  <p className="text-xs text-gray-300 py-4 text-center">暂无目标</p>
                ) : (
                  goals.map(goal => (
                    <button key={goal.id} onClick={() => { setLinkedGoalId(goal.id); setShowGoalPicker(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 mb-1 transition-colors ${linkedGoalId === goal.id ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColorMap[goal.category] || CATEGORY_COLORS[normalizeCategory(goal.category)] }} />
                      <span className="truncate">{goal.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            <label className="cursor-pointer p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
              <Camera size={18} className="text-gray-500" />
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
            </label>
            <label className="cursor-pointer p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
              <ImagePlus size={18} className="text-gray-500" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </label>
            <button onClick={() => onEdit(entry)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0" aria-label="编辑">
              <Pencil size={18} className="text-gray-500" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button
              onClick={() => { setShowTodoPicker(!showTodoPicker); setShowGoalPicker(false); }}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${linkedTodoId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
              aria-label="关联待办"
            >
              <CheckSquare size={18} />
            </button>
            <button
              onClick={() => { setShowGoalPicker(!showGoalPicker); setShowTodoPicker(false); }}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${linkedGoalId ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
              aria-label="关联目标"
            >
              <Target size={18} />
            </button>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-[#6DADD1] text-white px-5 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0">
            <Save size={16} className="inline mr-1" />保存
          </button>
        </div>

        {showTimePicker && (
          <div
            className="fixed inset-0 z-[120] flex items-end bg-slate-950/35 lg:items-center lg:justify-center lg:p-6"
            onWheel={(event) => event.preventDefault()}
            onTouchMove={(event) => event.preventDefault()}
          >
            <button className="absolute inset-0 cursor-default" onClick={() => setShowTimePicker(false)} aria-label="关闭时间选择" />
            <TimeRangeWheelPicker
              startTime={startTime}
              endTime={endTime}
              onChange={({ startTime: nextStart, endTime: nextEnd }) => {
                setStartTime(nextStart);
                setEndTime(nextEnd);
              }}
              onClose={() => setShowTimePicker(false)}
              className="max-h-[86vh] w-full overflow-y-auto rounded-b-none lg:max-w-3xl lg:rounded-[28px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
