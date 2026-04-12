import { BarChart2, Calendar, Download, User, ChevronRight } from 'lucide-react';
import Header from '../common/Header';
import type { User as UserType, Stats } from '../../types';

interface MeViewProps {
  onMoreClick: () => void;
  user?: UserType | null;
  stats?: Stats | null;
  onLogout: () => void;
}

export default function MeView({ onMoreClick, user, stats, onLogout }: MeViewProps) {
  const menuItems = [
    { icon: BarChart2, label: '统计报表', color: 'text-blue-500' },
    { icon: Calendar, label: '历史回顾', color: 'text-green-500' },
    { icon: Download, label: '导出数据', color: 'text-purple-500' },
    { icon: User, label: '个人资料', color: 'text-orange-500' },
  ];

  return (
    <div className="pb-20">
      <Header title="我的" onMoreClick={onMoreClick} />
      <div className="bg-[#6DADD1] px-6 pb-12 pt-4 flex items-center gap-4 text-white">
        <div className="w-20 h-20 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden">
          <User size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user?.displayName || '爱时间用户'}</h2>
          <p className="text-white/70 text-sm mt-1">@{user?.username || ''}</p>
        </div>
      </div>
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 gap-4 text-center">
          <div><p className="text-xl font-bold text-gray-700">{stats?.distinctDays ?? '-'}</p><p className="text-xs text-gray-400">坚持天数</p></div>
          <div><p className="text-xl font-bold text-gray-700">{stats?.recordRate != null ? `${stats.recordRate}%` : '-'}</p><p className="text-xs text-gray-400">记录率</p></div>
          <div><p className="text-xl font-bold text-gray-700">{stats?.totalEntries ?? '-'}</p><p className="text-xs text-gray-400">总记录数</p></div>
        </div>
      </div>
      <div className="mt-6 px-4 space-y-2">
        {menuItems.map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3"><item.icon size={20} className={item.color} /><span className="font-medium">{item.label}</span></div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        ))}
        <button onClick={onLogout} className="w-full bg-white p-4 rounded-xl flex items-center justify-center shadow-sm text-red-500 font-medium active:bg-gray-50 transition-colors">
          退出登录
        </button>
      </div>
    </div>
  );
}
