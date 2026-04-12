import { Clock, MapPin, Calendar, Brain, User } from 'lucide-react';

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
    <nav className="bg-white border-t border-gray-100 flex justify-around items-center py-2 fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 z-30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === tab.id ? 'text-[#5B8FF9]' : 'text-[#B0B0B0] hover:text-gray-400'
          }`}
        >
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
