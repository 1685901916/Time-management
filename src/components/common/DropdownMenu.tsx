import { X } from 'lucide-react';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  showBottomButtons: boolean;
  onToggleBottomButtons: () => void;
}

export default function DropdownMenu({ isOpen, onClose, showBottomButtons, onToggleBottomButtons }: DropdownMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    "使用秘籍", "分享", "搜索", "周视图", "早起打卡",
    "睡前复盘", "开始睡觉", "夜间睡眠统计",
    "个性化时间轴", "个性化概览页"
  ];

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="fixed top-12 right-2 w-56 bg-white rounded-lg shadow-2xl z-[70] py-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
        {menuItems.map((item, i) => (
          <button key={i} className="w-full text-left px-4 py-3 text-[15px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0" onClick={onClose}>
            {item}
          </button>
        ))}
        <div className="w-full flex items-center justify-between px-4 py-3 text-[15px] text-gray-700 hover:bg-gray-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleBottomButtons(); }}>
          <span>显示底部按钮</span>
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showBottomButtons ? 'bg-[#6DADD1] border-[#6DADD1]' : 'border-gray-300'}`}>
            {showBottomButtons && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 -mt-0.5" />}
          </div>
        </div>
      </div>
    </>
  );
}
