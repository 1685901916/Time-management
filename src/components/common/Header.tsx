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
    <header className="bg-[#6DADD1] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {onBack ? (
          <button onClick={onBack} className="p-1" aria-label="返回"><ChevronLeft size={24} /></button>
        ) : (
          leftIcon && <div className="p-1">{leftIcon}</div>
        )}
        <div className="text-xl font-medium">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        {rightIcons}
        {onMoreClick && (
          <button onClick={onMoreClick} className="p-1" aria-label="更多">
            <MoreVertical size={22} />
          </button>
        )}
      </div>
    </header>
  );
}
