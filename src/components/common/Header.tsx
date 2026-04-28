import React from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';

interface HeaderProps {
  title: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcons?: React.ReactNode;
  onBack?: () => void;
  onMoreClick?: () => void;
}

export default function Header({ title, leftIcon, rightIcons, onBack, onMoreClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-[#6DADD1] px-4 py-3 text-white lg:border-b lg:border-slate-200 lg:bg-white lg:px-7 lg:py-4 lg:text-slate-900">
      <div className="flex items-center gap-4">
        {onBack ? (
          <button onClick={onBack} className="cursor-pointer rounded-lg p-1 transition-colors lg:hover:bg-slate-100" aria-label="返回"><ChevronLeft size={24} /></button>
        ) : (
          leftIcon && <div className="rounded-lg p-1 lg:text-slate-500">{leftIcon}</div>
        )}
        <div className="text-xl font-medium lg:text-2xl lg:font-bold">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        {rightIcons}
        {onMoreClick && (
          <button onClick={onMoreClick} className="cursor-pointer rounded-lg p-1 transition-colors lg:text-slate-500 lg:hover:bg-slate-100 lg:hover:text-slate-800" aria-label="更多">
            <MoreVertical size={22} />
          </button>
        )}
      </div>
    </header>
  );
}
