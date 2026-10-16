'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { WorkoutSession } from '@/types/workout';
import Sheet from './Sheet';

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
    <Sheet
      title="ประวัติการฝึก"
      description={
        history.length > 0 ? (
          <>
            ทั้งหมด <span className="num font-semibold text-ink">{history.length}</span> ครั้ง
          </>
        ) : undefined
      }
      onClose={onClose}
    >
        <div>
          {history.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-ink">
              ยังไม่มีประวัติการฝึก
              <br />
              <span className="text-mute">
                เล่นเสร็จแล้วกดบันทึก ประวัติจะแสดงที่นี่
              </span>
            </div>
          ) : (
            <div className="divide-y divide-rule">
              {history.map((session) => {
                const minutes = Math.floor(session.duration_seconds / 60);

                return (
                  <div key={session.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-base">
                          {session.title || 'Workout'}
                        </div>
                        <div className="text-sm text-mute flex items-center flex-wrap gap-x-3 mt-0.5">
                          <span className="num">{session.date}</span>
                          <span>
                            <span className="num">{minutes}</span> นาที
                          </span>
                          {session.location_name && (
                            <span>{session.location_name}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        className="p-2 -mr-2 text-faint hover:text-plate-red hover:bg-plate-red/10 rounded-md"
                        title="ลบรายการนี้"
                        aria-label="ลบรายการนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Exercises list in this session */}
                    <div className="space-y-2">
                      {session.exercises.map((ex) => (
                        <div key={ex.id} className="text-sm">
                          <div className="flex justify-between gap-3 text-ink">
                            <span className="font-medium">{ex.exercise_name}</span>
                            <span className="text-mute shrink-0">
                              <span className="num">
                                {ex.sets.filter((s) => s.is_completed).length}
                              </span>{' '}
                              เซ็ต
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                            {ex.sets.map((s) => (
                              <span
                                key={s.id}
                                className={`num ${
                                  s.is_completed ? 'text-ink' : 'text-faint'
                                }`}
                              >
                                {s.weight_or_pin}
                                {ex.unit_type === 'pin' ? ' แผ่น' : ' kg'} × {s.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </Sheet>
  );
}
