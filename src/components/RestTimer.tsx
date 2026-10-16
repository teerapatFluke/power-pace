'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { playRestTimerBeep } from '@/lib/sound';

interface RestTimerProps {
  initialSeconds?: number;
  isActive: boolean;
  onClose: () => void;
}

export default function RestTimer({
  initialSeconds = 90,
  isActive,
  onClose,
}: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      setSecondsLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
    }
  }, [isActive, initialSeconds]);

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (soundEnabled) {
            playRestTimerBeep();
          }
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, soundEnabled]);

  if (!isActive) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const isFinished = secondsLeft === 0;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;

  const adjust = (delta: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + delta));
    if (delta > 0) setTotalSeconds((prev) => prev + delta);
  };

  const ctrlBtn =
    'h-10 min-w-10 px-2 rounded-md text-sm font-semibold text-ink hover:bg-ink/10 active:bg-ink/15 transition-colors';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] bg-plate-yellow text-ink shadow-[0_-1px_0_rgba(0,0,0,0.12)]"
      role="timer"
      aria-live="polite"
    >
      {/* Remaining time drains from right to left */}
      <div className="h-1 bg-ink/10">
        <div
          className="h-full bg-ink transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            {isFinished ? 'หมดเวลาพัก เริ่มเซ็ตต่อไปได้' : 'พักระหว่างเซ็ต'}
          </div>
          <div className="num text-4xl font-bold leading-none mt-0.5">
            {formatTime(secondsLeft)}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => adjust(-15)} className={`num ${ctrlBtn}`}>
            −15
          </button>
          <button type="button" onClick={() => adjust(30)} className={`num ${ctrlBtn}`}>
            +30
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={ctrlBtn}
            aria-label={soundEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือน'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 mx-auto" />
            ) : (
              <VolumeX className="w-5 h-5 mx-auto opacity-50" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={ctrlBtn}
            aria-label="ปิดตัวจับเวลา"
          >
            <X className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
