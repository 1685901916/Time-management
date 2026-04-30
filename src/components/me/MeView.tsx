import { BarChart2, Calendar, ChevronRight, Download, LogOut, User } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import type { User as UserType, Stats } from '../../types';

interface MeViewProps {
  onMoreClick: () => void;
  user?: UserType | null;
  stats?: Stats | null;
  onLogout: () => void;
}

const menuItems = [
  { icon: BarChart2, label: '统计报表', hint: '更细粒度的趋势与对比' },
  { icon: Calendar, label: '历史回顾', hint: '查看过往的时间地图' },
  { icon: Download, label: '导出数据', hint: '把记录导成 CSV / Markdown' },
  { icon: User, label: '个人资料', hint: '昵称、头像、密码' },
];

export default function MeView({ user, stats, onLogout }: MeViewProps) {
  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 lg:pb-12">
      <PageHeader
        title="我的"
        actions={
          <button
            onClick={onLogout}
            className="flex h-11 cursor-pointer items-center gap-1.5 rounded-2xl bg-white px-4 text-sm font-extrabold text-red-500 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.45)] transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            退出登录
          </button>
        }
      />

      <main className="mx-auto w-full max-w-[1280px] space-y-5 px-4 py-5 sm:px-5 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <article className="minimal-card flex items-center gap-4 p-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--color-accent-mint-fill)',
                color: 'var(--color-accent-mint-ink)',
              }}
            >
              <User size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold text-slate-950">{user?.displayName || '爱时间用户'}</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-500">@{user?.username || 'guest'}</p>
            </div>
          </article>

          <article className="minimal-card grid grid-cols-3 gap-2 p-5 sm:gap-4">
            <Stat label="坚持天数" value={stats?.distinctDays} />
            <Stat label="记录率" value={stats?.recordRate != null ? `${stats.recordRate}%` : null} />
            <Stat label="总记录数" value={stats?.totalEntries} />
          </article>
        </section>

        <section className="minimal-card divide-y divide-slate-100 overflow-hidden">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'var(--color-accent-mint-fill)',
                  color: 'var(--color-accent-mint-ink)',
                }}
              >
                <item.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-950">{item.label}</p>
                <p className="mt-0.5 truncate text-xs font-bold text-slate-500">{item.hint}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="text-center">
      <p className="number-font text-2xl font-extrabold text-slate-950">{value ?? '-'}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
