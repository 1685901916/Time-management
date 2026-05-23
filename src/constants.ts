export const CATEGORY_VALUES = [
  '学习',
  '睡觉',
  '刷手机',
  '游戏',
  '工作',
  '信息',
  '户外',
  '写笔记',
  '休息',
  '运动',
  '未记录',
] as const;

export type CategoryType = (typeof CATEGORY_VALUES)[number];

export const QUADRANT_VALUES = [
  '重要且紧急',
  '重要不紧急',
  '不重要但紧急',
  '不重要不紧急',
] as const;

export type QuadrantType = (typeof QUADRANT_VALUES)[number];

const LEGACY_CATEGORY_ALIASES: Record<string, CategoryType> = {
  '瀛︿範': '学习',
  '鐫¤': '睡觉',
  '睡眠': '睡觉',
  '鍒锋墜鏈�': '刷手机',
  '鍒锋墜鏈?': '刷手机',
  '娓告垙': '游戏',
  '淇℃伅宸ヤ綔': '信息',
  '信息工作': '信息',
  '琐事': '信息',
  '鎴峰': '户外',
  '鍐欑瑪璁�': '写笔记',
  '鍐欑瑪璁?': '写笔记',
  '浼戞伅': '休息',
  '鐞愪簨': '未记录',
  '杩愬姩': '运动',
  '�˶�': '运动',
  '鏈褰�': '未记录',
  '鏈褰?': '未记录',
};

const LEGACY_QUADRANT_ALIASES: Record<string, QuadrantType> = {
  '閲嶈涓旂揣鎬�': '重要且紧急',
  '閲嶈涓旂揣鎬?': '重要且紧急',
  '閲嶈涓嶇揣鎬�': '重要不紧急',
  '閲嶈涓嶇揣鎬?': '重要不紧急',
  '涓嶉噸瑕佷絾绱ф€�': '不重要但紧急',
  '涓嶉噸瑕佷絾绱ф€?': '不重要但紧急',
  '涓嶉噸瑕佷笉绱ф€�': '不重要不紧急',
  '涓嶉噸瑕佷笉绱ф€?': '不重要不紧急',
};

export function normalizeCategory(value?: string | null): CategoryType {
  if (!value) return '未记录';
  if ((CATEGORY_VALUES as readonly string[]).includes(value)) return value as CategoryType;
  return LEGACY_CATEGORY_ALIASES[value] || '未记录';
}

export function getCategoryColor(value?: string | null, customColors: Record<string, string> = {}) {
  if (value && customColors[value]) return customColors[value];
  return CATEGORY_COLORS[normalizeCategory(value)] || CATEGORY_COLORS.未记录;
}

export function sortCategoriesForDisplay(categories: CategoryType[]): CategoryType[] {
  const ordered: CategoryType[] = [];
  const seen = new Set<CategoryType>();

  categories.forEach((category) => {
    const normalized = normalizeCategory(category);
    if (normalized === '未记录' || seen.has(normalized)) return;
    seen.add(normalized);
    ordered.push(normalized);
  });

  const sleepIndex = ordered.indexOf('睡觉');
  if (sleepIndex > -1 && ordered.length > 1) {
    ordered.splice(sleepIndex, 1);
    ordered.splice(1, 0, '睡觉');
  }

  return ordered;
}

export function normalizeQuadrant(value?: string | null): QuadrantType {
  if (!value) return '重要且紧急';
  if ((QUADRANT_VALUES as readonly string[]).includes(value)) return value as QuadrantType;
  return LEGACY_QUADRANT_ALIASES[value] || '重要且紧急';
}

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  学习: '#FFD966',
  睡觉: '#6DADD1',
  刷手机: '#76C893',
  游戏: '#E63946',
  工作: '#F4A261',
  信息: '#5C7CFA',
  户外: '#F77F00',
  写笔记: '#E76F51',
  休息: '#A8DADC',
  运动: '#F08080',
  未记录: '#E5E7EB',
};

export const EDITABLE_CATEGORY_VALUES = sortCategoriesForDisplay(
  CATEGORY_VALUES.filter((category) => category !== '未记录') as CategoryType[]
);

export const QUADRANT_CONFIG: Record<QuadrantType, { color: string; icon: string; label: string; bg: string }> = {
  重要且紧急: { color: '#EF4444', icon: 'I', label: '重要且紧急', bg: '#FEF2F2' },
  重要不紧急: { color: '#F59E0B', icon: 'II', label: '重要不紧急', bg: '#FFFBEB' },
  不重要但紧急: { color: '#3B82F6', icon: 'III', label: '不重要但紧急', bg: '#EFF6FF' },
  不重要不紧急: { color: '#10B981', icon: 'IV', label: '不重要不紧急', bg: '#ECFDF5' },
};

export const GOAL_COLOR_PRESETS = [
  '#6DADD1', '#4FC3F7', '#5C7CFA', '#7C4DFF', '#9775FA', '#B197FC', '#845EC2', '#3F37C9',
  '#0EA5E9', '#0891B2', '#14B8A6', '#0D9488', '#22C55E', '#16A34A', '#76C893', '#52B788',
  '#2ECA8B', '#10B981', '#84CC16', '#94D82D', '#A3E635', '#EAB308', '#F9C74F', '#FFD166',
  '#FACC15', '#F59E0B', '#F4A261', '#FB923C', '#FF922B', '#F77F00', '#EA580C', '#E76F51',
  '#FF6B6B', '#EF4444', '#E63946', '#F08080', '#F87171', '#FB7185', '#F783AC', '#EC4899',
  '#D6336C', '#DB2777', '#C026D3', '#A21CAF', '#7E22CE', '#6D28D9', '#4338CA', '#1E40AF',
  '#A8DADC', '#ADB5BD', '#94A3B8', '#64748B', '#475569', '#334155', '#1F2937', '#495057',
] as const;

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
