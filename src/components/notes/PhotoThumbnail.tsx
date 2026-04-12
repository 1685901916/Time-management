import { X } from 'lucide-react';

interface PhotoThumbnailProps {
  src: string;
  caption?: string;
  onRemove?: () => void;
}

export default function PhotoThumbnail({ src, onRemove }: PhotoThumbnailProps) {
  return (
    <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden group">
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="删除"
        >
          <X size={12} className="text-white" />
        </button>
      )}
    </div>
  );
}
