'use client';

import React from 'react';
import { X, Calendar, Clock, Dumbbell, Trash2 } from 'lucide-react';
import { WorkoutSession } from '@/types/workout';

interface HistoryModalProps {
  isOpen: boolean;
  history: WorkoutSession[];
  onClose: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function HistoryModal({
  isOpen,
  history,
  onClose,
  onDeleteSession,
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-xl bg-[#121721] rounded-t-3xl sm:rounded-3xl border border-[#1f2737] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">ประวัติการฝึกซ้อม</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Dumbbell className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              ยังไม่มีประวัติการฝึกซ้อม
              <br />
              <span className="text-xs text-gray-400">
                เมื่อเล่นเสร็จแล้วกดบันทึก ประวัติจะมาแสดงที่นี่
              </span>
            </div>
          ) : (
            history.map((session) => {
              const minutes = Math.floor(session.duration_seconds / 60);

              return (
                <div
                  key={session.id}
                  className="bg-[#18202f] rounded-2xl p-4 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div>
                      <div className="font-black text-white text-base">
                        {session.title || 'Workout'}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>📅 {session.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {minutes} นาที
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Exercises list in this session */}
                  <div className="space-y-2">
                    {session.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="bg-[#121721] p-2.5 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex justify-between font-bold text-gray-200">
                          <span>{ex.exercise_name}</span>
                          <span className="text-gray-400">
                            {ex.sets.filter((s) => s.is_completed).length} เซ็ต
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {ex.sets.map((s, idx) => (
                            <span
                              key={s.id}
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                s.is_completed
                                  ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                                  : 'bg-white/5 text-gray-400'
                              }`}
                            >
                              S{idx + 1}: {s.weight_or_pin}
                              {ex.unit_type === 'pin' ? 'แผ่น' : 'kg'} × {s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
