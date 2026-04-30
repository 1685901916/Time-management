import type { ReactNode } from 'react';

type AccentTone = 'mint' | 'teal' | 'amber' | 'slate';

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  accent?: AccentTone;
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
}

const ACCENT_STYLES: Record<AccentTone, { fg: string; bg: string }> = {
  mint: { fg: 'var(--color-accent-mint-ink)', bg: 'var(--color-accent-mint-fill)' },
  teal: { fg: '#0F766E', bg: '#CCFBF1' },
  amber: { fg: '#B45309', bg: '#FEF3C7' },
  slate: { fg: '#0F172A', bg: '#F1F5F9' },
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  accent = 'mint',
  actions,
  sticky = true,
  className = '',
}: PageHeaderProps) {
  const tone = ACCENT_STYLES[accent];

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-20' : ''} border-b border-slate-100/80 bg-[#F6F8FB]/85 backdrop-blur supports-[backdrop-filter]:bg-[#F6F8FB]/70 ${className}`}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {eyebrow && (
            <span
              className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em]"
              style={{ background: tone.bg, color: tone.fg }}
            >
              {eyebrow}
            </span>
          )}
          <h1 className="truncate text-[24px] font-extrabold leading-tight text-slate-950 sm:text-[28px] lg:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="text-sm font-bold text-slate-500">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
