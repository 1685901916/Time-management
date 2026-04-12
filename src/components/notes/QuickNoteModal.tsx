import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, ImagePlus, Save, Pencil, Maximize2, Minimize2, Bold, Italic, List, ListOrdered, Hash, Link2, CheckSquare, Target, ChevronDown } from 'lucide-react';
import type { TimeEntry, Todo, Goal } from '../../types';
import { CATEGORY_COLORS } from '../../constants';
import { uploadPhoto, deletePhoto } from '../../api/entries';
import PhotoThumbnail from './PhotoThumbnail';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimeEntry | null;
  onSave: (entryId: string, note: string, linkedTodoId?: string, linkedGoalId?: string) => void;
  onEdit: (entry: TimeEntry) => void;
  onPhotoChange: () => void;
  todos?: Todo[];
  goals?: Goal[];
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function QuickNoteModal({ isOpen, onClose, entry, onSave, onEdit, onPhotoChange, todos = [], goals = [] }: QuickNoteModalProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkedTodoId, setLinkedTodoId] = useState<string | undefined>();
  const [linkedGoalId, setLinkedGoalId] = useState<string | undefined>();
  const [showTodoPicker, setShowTodoPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from entry
  useEffect(() => {
    if (entry) {
      setNote(entry.note || '');
      setLinkedTodoId(entry.linkedTodoId);
      setLinkedGoalId(entry.linkedGoalId);
    }
  }, [entry]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setExpanded(false);
      setShowPreview(false);
      setShowTodoPicker(false);
      setShowGoalPicker(false);
    }
  }, [isOpen]);

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
      onSave(entry.id, note, linkedTodoId, linkedGoalId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const linkedTodo = todos.find(t => t.id === linkedTodoId);
  const linkedGoal = goals.find(g => g.id === linkedGoalId);
  const uncompletedTodos = todos.filter(t => !t.completed && !t.isArchived);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative bg-white z-10 flex flex-col ${expanded ? 'h-full rounded-none' : 'rounded-t-3xl max-h-[85vh]'}`}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.category] }} />
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-800">{entry.category}</span>
              <span className="text-xs text-gray-400 ml-2">{entry.startTime} ~ {entry.endTime}</span>
              <span className="text-xs text-gray-400 ml-2">{entry.durationMinutes}分钟</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setExpanded(!expanded)} className="p-2 bg-gray-100 rounded-full" aria-label={expanded ? '缩小' : '展开'}>
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
          </div>
        </div>

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
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(note) }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录这一刻的想法... 支持 Markdown 格式"
              className={`w-full text-[15px] text-gray-700 outline-none resize-none placeholder-gray-300 leading-relaxed ${expanded ? 'h-full min-h-[300px]' : 'h-32'}`}
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
        <AnimatePresence>
          {showTodoPicker && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-100 flex-shrink-0">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goal picker */}
        <AnimatePresence>
          {showGoalPicker && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-100 flex-shrink-0">
              <div className="px-5 py-3 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-gray-400 mb-2">选择关联目标</p>
                {goals.length === 0 ? (
                  <p className="text-xs text-gray-300 py-4 text-center">暂无目标</p>
                ) : (
                  goals.map(goal => (
                    <button key={goal.id} onClick={() => { setLinkedGoalId(goal.id); setShowGoalPicker(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 mb-1 transition-colors ${linkedGoalId === goal.id ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[goal.category] }} />
                      <span className="truncate">{goal.title}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      </motion.div>
    </div>
  );
}
