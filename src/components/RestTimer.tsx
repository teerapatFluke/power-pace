'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Timer, Plus, Minus, X, Volume2, VolumeX } from 'lucide-react';
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      setSecondsLeft(initialSeconds);
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
      <div
        className={`glass-panel rounded-2xl p-4 shadow-2xl transition-all duration-300 border ${
          isFinished
            ? 'bg-emerald-950/90 border-emerald-500/80 glow-lime'
            : 'bg-[#121721]/95 border-emerald-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isFinished
                  ? 'bg-emerald-500 text-black animate-bounce'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">
                {isFinished ? '🔥 ถึงเวลาเล่นเซ็ตต่อไป!' : '⏱️ เวลาพักระหว่างเซ็ต'}
              </div>
              <div
                className={`text-2xl font-black tracking-wider ${
                  isFinished ? 'text-emerald-300' : 'text-white'
                }`}
              >
                {formatTime(secondsLeft)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              title="เปิด/ปิดเสียง"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSecondsLeft((prev) => Math.max(0, prev - 15))}
              className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 active:scale-95 transition"
              title="-15 วิ"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSecondsLeft((prev) => prev + 30)}
              className="px-2.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold text-xs active:scale-95 transition flex items-center gap-1"
              title="+30 วิ"
            >
              <Plus className="w-3.5 h-3.5" />
              30s
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800/80 hover:bg-red-500/20 hover:text-red-400 text-gray-400 active:scale-95 transition"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
