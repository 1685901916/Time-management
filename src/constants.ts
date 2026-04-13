export const CATEGORY_VALUES = [
  '学习',
  '睡觉',
  '刷手机',
  '游戏',
  '信息工作',
  '户外',
  '写笔记',
  '休息',
  '琐事',
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
  '鍒锋墜鏈�': '刷手机',
  '鍒锋墜鏈?': '刷手机',
  '娓告垙': '游戏',
  '淇℃伅宸ヤ綔': '信息工作',
  '鎴峰': '户外',
  '鍐欑瑪璁�': '写笔记',
  '鍐欑瑪璁?': '写笔记',
  '浼戞伅': '休息',
  '鐞愪簨': '琐事',
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
  信息工作: '#F4A261',
  户外: '#FBC4AB',
  写笔记: '#E76F51',
  休息: '#A8DADC',
  琐事: '#DDE5ED',
  运动: '#F08080',
  未记录: '#E5E7EB',
};

export const QUADRANT_CONFIG: Record<QuadrantType, { color: string; icon: string; label: string; bg: string }> = {
  重要且紧急: { color: '#FF5C5C', icon: 'I', label: '重要且紧急', bg: '#FEECEC' },
  重要不紧急: { color: '#FFA726', icon: 'II', label: '重要不紧急', bg: '#FFF4E5' },
  不重要但紧急: { color: '#42A5F5', icon: 'III', label: '不重要但紧急', bg: '#E3F2FD' },
  不重要不紧急: { color: '#2ECA8B', icon: 'IV', label: '不重要不紧急', bg: '#E8F5E9' },
};

export const GOAL_COLOR_PRESETS = [
  '#6DADD1', '#4FC3F7', '#5C7CFA', '#7C4DFF', '#9775FA', '#B197FC',
  '#76C893', '#52B788', '#2ECA8B', '#94D82D', '#F9C74F', '#FFD166',
  '#F4A261', '#FF922B', '#F77F00', '#E76F51', '#FF6B6B', '#E63946',
  '#F08080', '#F783AC', '#D6336C', '#A8DADC', '#ADB5BD', '#495057',
] as const;

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
