'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  /** Raise above another open sheet */
  stacked?: boolean;
}

export default function Sheet({
  title,
  description,
  onClose,
  children,
  footer,
  size = 'lg',
  stacked = false,
}: SheetProps) {
  const titleId = useId();
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Close on Escape and lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      className={`sheet-backdrop fixed inset-0 ${
        stacked ? 'z-[60]' : 'z-50'
      } flex items-end sm:items-center justify-center bg-ink/45 sm:p-6`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`sheet-panel w-full ${
          size === 'md' ? 'sm:max-w-md' : 'sm:max-w-xl'
        } bg-paper rounded-t-2xl sm:rounded-2xl shadow-[0_-12px_40px_rgba(29,31,34,0.18)] flex flex-col max-h-[88vh] overflow-hidden`}
      >
        {/* Grab handle, phones only */}
        <div className="sm:hidden pt-2.5 flex justify-center" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-rule" />
        </div>

        <header className="px-5 pt-3 sm:pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold text-ink leading-snug">
              {title}
            </h2>
            {description && (
              <div className="mt-1 text-sm text-mute leading-relaxed">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="shrink-0 -mr-1 w-9 h-9 flex items-center justify-center rounded-full bg-well text-mute hover:text-ink hover:bg-rule/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar border-t border-rule">
          {children}
        </div>

        {footer && (
          <div className="px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-rule bg-paper">
            {footer}
          </div>
        )}
        {!footer && <div className="pb-[env(safe-area-inset-bottom)]" />}
      </div>
    </div>
  );
}
