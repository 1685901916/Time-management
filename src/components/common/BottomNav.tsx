import { Clock, MapPin, Calendar, Brain, User, HelpCircle, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'time', label: '时间', icon: Clock },
  { id: 'todo', label: '待办', icon: MapPin },
  { id: 'goal', label: '目标', icon: Calendar },
  { id: 'analysis', label: '分析', icon: Brain },
  { id: 'me', label: '我的', icon: User },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-200 bg-white px-5 py-6 shadow-sm lg:flex lg:flex-col">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">时间管理</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Deep Work Suite</p>
        </div>

        <nav className="mt-12 flex flex-1 flex-col gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors duration-200 ${
                  isActive ? 'text-slate-950' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-indicator"
                    className="absolute inset-0 -z-10 rounded-xl bg-slate-100"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                <tab.icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2">
          <button className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800">
            <HelpCircle size={20} />
            帮助
          </button>
          <button className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800">
            <Settings size={20} />
            设置
          </button>
        </div>
      </aside>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <nav className="flex w-full items-stretch border-t border-slate-100 bg-white px-1 pt-1.5 pb-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
                  isActive ? 'text-slate-950' : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-0.5">
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
                </motion.div>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
