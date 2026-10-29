'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Check,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { WorkoutSession } from '@/types/workout';
import Sheet from './Sheet';

interface HistoryModalProps {
  isOpen: boolean;
  history: WorkoutSession[];
  onClose: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const THAI_DAYS = [
  { dayIndex: 1, name: 'วันจันทร์', short: 'จ.', badgeColor: 'bg-yellow-500/15 text-yellow-800 border-yellow-500/30' },
  { dayIndex: 2, name: 'วันอังคาร', short: 'อ.', badgeColor: 'bg-pink-500/10 text-pink-700 border-pink-500/20' },
  { dayIndex: 3, name: 'วันพุธ', short: 'พ.', badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  { dayIndex: 4, name: 'วันพฤหัสบดี', short: 'พฤ.', badgeColor: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  { dayIndex: 5, name: 'วันศุกร์', short: 'ศ.', badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  { dayIndex: 6, name: 'วันเสาร์', short: 'ส.', badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  { dayIndex: 0, name: 'วันอาทิตย์', short: 'อา.', badgeColor: 'bg-red-500/10 text-red-700 border-red-500/20' },
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
}

function formatThaiDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function HistoryModal({
  isOpen,
  history,
  onClose,
  onDeleteSession,
}: HistoryModalProps) {
  // Sets of expanded days (0-6) and expanded session IDs
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Group history by Day of Week (Monday -> Sunday)
  const groupedDays = useMemo(() => {
    // Map dayIndex -> list of sessions
    const map = new Map<number, WorkoutSession[]>();

    history.forEach((session) => {
      const d = parseDate(session.date);
      const dayIndex = isNaN(d.getTime()) ? 0 : d.getDay();
      if (!map.has(dayIndex)) {
        map.set(dayIndex, []);
      }
      map.get(dayIndex)!.push(session);
    });

    // Sort sessions in each day newest date first
    map.forEach((sessions) => {
      sessions.sort((a, b) => {
        const timeA = parseDate(a.date).getTime();
        const timeB = parseDate(b.date).getTime();
        return timeB - timeA;
      });
    });

    // Return in Monday -> Sunday order, filtering out days with 0 sessions
    return THAI_DAYS.map((dayMeta) => {
      const sessions = map.get(dayMeta.dayIndex) || [];
      return {
        ...dayMeta,
        sessions,
        count: sessions.length,
        latestSessionDate: sessions.length > 0 ? sessions[0].date : null,
      };
    }).filter((g) => g.count > 0);
  }, [history]);

  // Default expand the first day and first session when modal opens
  useEffect(() => {
    if (isOpen && history.length > 0 && expandedDays.size === 0) {
      const firstSession = history[0];
      const d = parseDate(firstSession.date);
      const firstDayIndex = isNaN(d.getTime()) ? 0 : d.getDay();
      setExpandedDays(new Set([firstDayIndex]));
      setExpandedSessions(new Set([firstSession.id]));
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex)) {
        next.delete(dayIndex);
      } else {
        next.add(dayIndex);
      }
      return next;
    });
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const allDayIndexes = groupedDays.map((g) => g.dayIndex);
  const isAllExpanded =
    groupedDays.length > 0 && allDayIndexes.every((idx) => expandedDays.has(idx));

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedDays(new Set());
      setExpandedSessions(new Set());
    } else {
      setExpandedDays(new Set(allDayIndexes));
      setExpandedSessions(new Set(history.map((s) => s.id)));
    }
  };

  const handleDelete = (session: WorkoutSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = formatThaiDate(session.date);
    const confirmed = window.confirm(
      `ต้องการลบประวัติการฝึกวันที่ ${formatted} (${session.title || 'Workout'}) หรือไม่?`
    );
    if (confirmed) {
      onDeleteSession(session.id);
    }
  };

  return (
    <Sheet
      title="ประวัติการฝึก"
      description={
        history.length > 0 ? (
          <>
            ทั้งหมด <span className="num font-semibold text-ink">{history.length}</span> ครั้ง
            <span className="text-mute ml-1">
              (แยกตาม {groupedDays.length} วันในสัปดาห์)
            </span>
          </>
        ) : undefined
      }
      onClose={onClose}
    >
      <div>
        {history.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-ink">
            <div className="w-12 h-12 rounded-full bg-well mx-auto flex items-center justify-center mb-3 text-faint">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="font-semibold text-base mb-1">ยังไม่มีประวัติการฝึก</div>
            <span className="text-mute">
              เล่นเสร็จแล้วกดบันทึกรอบฝึก ประวัติจะแยกตามวันในสัปดาห์ให้ที่นี่
            </span>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {/* Header controls */}
            <div className="flex items-center justify-between px-4 pt-1 pb-2 border-b border-rule/60 text-xs text-mute">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-plate-blue" />
                แตะวันเพื่อขยายวันที่ แล้วแตะวันที่เพื่อดูท่าที่เล่น
              </span>
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="px-2 py-1 rounded bg-well hover:bg-rule/60 text-ink font-medium transition-colors"
              >
                {isAllExpanded ? 'ยุบทั้งหมด' : 'ขยายทั้งหมด'}
              </button>
            </div>

            {/* Level 1: Day of Week Groups */}
            <div className="divide-y divide-rule/60">
              {groupedDays.map((group) => {
                const isDayExpanded = expandedDays.has(group.dayIndex);

                return (
                  <div key={group.dayIndex} className="transition-colors">
                    {/* Level 1 Header: Day of Week */}
                    <button
                      type="button"
                      onClick={() => toggleDay(group.dayIndex)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-well/50 active:bg-well transition-colors"
                      aria-expanded={isDayExpanded}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Day badge */}
                        <span
                          className={`w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 ${group.badgeColor}`}
                        >
                          {group.short}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-base text-ink">
                              {group.name}
                            </span>
                            <span className="text-xs text-mute font-medium">
                              <span className="num font-semibold text-ink">
                                {group.count}
                              </span>{' '}
                              ครั้ง
                            </span>
                          </div>

                          {group.latestSessionDate && (
                            <div className="text-xs text-mute flex items-center gap-1 mt-0.5">
                              <span>ล่าสุด:</span>
                              <span className="num font-medium text-ink">
                                {formatThaiDate(group.latestSessionDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-mute">
                        <span className="text-xs font-medium hidden sm:inline">
                          {isDayExpanded ? 'ซ่อน' : 'ดูวันที่'}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-faint transition-transform duration-200 ${
                            isDayExpanded ? 'rotate-180 text-ink' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Level 2: Dates under this Day of Week */}
                    {isDayExpanded && (
                      <div className="bg-well/30 px-3 sm:px-4 py-2 space-y-2.5 border-t border-rule/40">
                        {group.sessions.map((session) => {
                          const isSessionExpanded = expandedSessions.has(session.id);
                          const minutes = Math.floor(session.duration_seconds / 60);
                          const totalCompletedSets = session.exercises.reduce(
                            (acc, ex) =>
                              acc + ex.sets.filter((s) => s.is_completed).length,
                            0
                          );
                          const totalVolume = session.exercises.reduce((acc, ex) => {
                            return (
                              acc +
                              ex.sets
                                .filter((s) => s.is_completed)
                                .reduce(
                                  (sAcc, s) =>
                                    sAcc +
                                    (Number(s.weight_or_pin) || 0) * (Number(s.reps) || 0),
                                  0
                                )
                            );
                          }, 0);

                          return (
                            <div
                              key={session.id}
                              className="bg-paper border border-rule rounded-lg overflow-hidden shadow-xs"
                            >
                              {/* Level 2 Header: Date Row */}
                              <div
                                onClick={() => toggleSession(session.id)}
                                className="px-3.5 py-3 flex items-start justify-between gap-2 cursor-pointer hover:bg-well/40 active:bg-well transition-colors select-none"
                              >
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div className="mt-0.5 text-faint shrink-0">
                                    {isSessionExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-ink" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                                      <span className="num font-bold text-sm sm:text-base text-ink">
                                        {formatThaiDate(session.date)}
                                      </span>
                                      <span className="text-xs sm:text-sm font-semibold text-plate-blue truncate">
                                        {session.title || 'Workout'}
                                      </span>
                                    </div>

                                    {/* Quick tags */}
                                    <div className="text-xs text-mute flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                                      {minutes > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-faint" />
                                          <span className="num font-medium text-ink">{minutes}</span> นาที
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Dumbbell className="w-3 h-3 text-faint" />
                                        <span className="num font-medium text-ink">
                                          {session.exercises.length}
                                        </span>{' '}
                                        ท่า
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-plate-green" />
                                        <span className="num font-medium text-ink">
                                          {totalCompletedSets}
                                        </span>{' '}
                                        เซ็ต
                                      </span>
                                      {session.location_name && (
                                        <span className="flex items-center gap-1 text-faint">
                                          <MapPin className="w-3 h-3" />
                                          <span className="truncate max-w-[120px]">
                                            {session.location_name}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(session, e)}
                                  className="p-1.5 text-faint hover:text-plate-red hover:bg-plate-red/10 rounded-md shrink-0 transition-colors"
                                  title="ลบรอบฝึกนี้"
                                  aria-label="ลบรอบฝึกนี้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Level 3: Session Workout Details (Exercises & Sets) */}
                              {isSessionExpanded && (
                                <div className="px-3.5 pb-3.5 pt-1 border-t border-rule/50 bg-paper/50 space-y-3">
                                  {/* Exercises list */}
                                  <div className="space-y-2.5 divide-y divide-rule/30">
                                    {session.exercises.map((ex, exIdx) => {
                                      const completedSets = ex.sets.filter((s) => s.is_completed);

                                      return (
                                        <div
                                          key={ex.id || exIdx}
                                          className={`text-sm ${exIdx > 0 ? 'pt-2.5' : ''}`}
                                        >
                                          <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="font-semibold text-ink flex items-center gap-2">
                                              <span>{ex.exercise_name}</span>
                                              {ex.category && (
                                                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-well text-mute">
                                                  {ex.category}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-xs text-mute shrink-0">
                                              <span className="num font-medium text-ink">
                                                {completedSets.length}
                                              </span>
                                              /{ex.sets.length} เซ็ต
                                            </span>
                                          </div>

                                          {/* Sets pills */}
                                          <div className="flex flex-wrap gap-1.5">
                                            {ex.sets.map((s, sIdx) => {
                                              const isDone = s.is_completed;
                                              const unit = ex.unit_type === 'pin' ? ' แผ่น' : ' kg';

                                              return (
                                                <span
                                                  key={s.id || sIdx}
                                                  className={`num inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                                                    isDone
                                                      ? 'bg-well/80 border-rule text-ink font-medium'
                                                      : 'bg-paper border-rule/40 text-faint line-through'
                                                  }`}
                                                >
                                                  <span className="text-[10px] text-mute">#{s.set_number || sIdx + 1}</span>
                                                  <span>
                                                    {s.weight_or_pin}
                                                    {unit} × {s.reps}
                                                  </span>
                                                  {isDone && (
                                                    <Check className="w-3 h-3 text-plate-green stroke-[3]" />
                                                  )}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Session Footer Stats */}
                                  {totalVolume > 0 && (
                                    <div className="pt-2 border-t border-rule/50 flex items-center justify-between text-xs text-mute">
                                      <span>น้ำหนักยกสะสมรวม (Volume):</span>
                                      <span className="num font-bold text-ink">
                                        {totalVolume.toLocaleString()} kg
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
