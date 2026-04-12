export type CategoryType = '学习' | '睡觉' | '刷手机' | '游戏' | '信息工作' | '户外' | '写笔记' | '休息' | '琐事' | '运动' | '未记录';
export type QuadrantType = '重要且紧急' | '重要不紧急' | '不重要但紧急' | '不重要不紧急';

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  '学习': '#FFD966',
  '睡觉': '#6DADD1',
  '刷手机': '#76C893',
  '游戏': '#E63946',
  '信息工作': '#F4A261',
  '户外': '#FBC4AB',
  '写笔记': '#E76F51',
  '休息': '#A8DADC',
  '琐事': '#DDE5ED',
  '运动': '#F08080',
  '未记录': '#E5E7EB',
};

export const QUADRANT_CONFIG: Record<QuadrantType, { color: string; icon: string; label: string; bg: string }> = {
  '重要且紧急': { color: '#FF5C5C', icon: 'I', label: '重要且紧急', bg: '#FEECEC' },
  '重要不紧急': { color: '#FFA726', icon: 'II', label: '重要不紧急', bg: '#FFF4E5' },
  '不重要但紧急': { color: '#42A5F5', icon: 'III', label: '不重要但紧急', bg: '#E3F2FD' },
  '不重要不紧急': { color: '#2ECA8B', icon: 'IV', label: '不重要不紧急', bg: '#E8F5E9' },
};

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
