'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CloudCheck, HardDrive } from 'lucide-react';
import { WorkoutSession } from '@/types/workout';
import Sheet from './Sheet';

interface WorkoutSummaryModalProps {
  workout: WorkoutSession;
  supabaseSynced: boolean;
  onClose: () => void;
}

export default function WorkoutSummaryModal({
  workout,
  supabaseSynced,
  onClose,
}: WorkoutSummaryModalProps) {
  useEffect(() => {
    // Fire festive gym confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1f4fa3', '#2c7a4b', '#b8322b', '#f0c02e'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Calculate workout statistics
  let totalVolumeKg = 0;
  let totalSetsCompleted = 0;
  let totalRepsCompleted = 0;

  workout.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      if (s.is_completed) {
        totalSetsCompleted += 1;
        totalRepsCompleted += s.reps;
        if (ex.unit_type === 'kg') {
          totalVolumeKg += s.weight_or_pin * s.reps;
        }
      }
    });
  });

  const minutes = Math.floor(workout.duration_seconds / 60);
  const seconds = workout.duration_seconds % 60;

  return (
    <Sheet
      title="ฝึกเสร็จแล้ว"
      description={workout.title}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-plate-blue text-white font-semibold rounded-md px-4 py-3 hover:bg-plate-blue-dark"
        >
          กลับหน้าหลัก
        </button>
      }
    >

        {/* Stats row */}
        <div className="grid grid-cols-4 divide-x divide-rule py-5">
          <div className="px-2 text-center">
            <div className="num text-2xl sm:text-3xl font-semibold text-ink">
              {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-mute mt-1">เวลา</div>
          </div>

          <div className="px-2 text-center">
            <div className="num text-2xl sm:text-3xl font-semibold text-ink">
              {totalSetsCompleted}
            </div>
            <div className="text-xs text-mute mt-1">เซ็ตที่ทำ</div>
          </div>

          <div className="px-2 text-center">
            <div className="num text-2xl sm:text-3xl font-semibold text-ink">
              {totalRepsCompleted}
            </div>
            <div className="text-xs text-mute mt-1">ครั้งรวม</div>
          </div>

          <div className="px-2 text-center">
            {totalVolumeKg > 0 ? (
              <div className="num text-2xl sm:text-3xl font-semibold text-ink">
                {totalVolumeKg.toLocaleString()}
              </div>
            ) : (
              <div className="num text-2xl sm:text-3xl font-semibold text-faint">-</div>
            )}
            <div className="text-xs text-mute mt-1">น้ำหนักรวม (kg)</div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="px-5 py-3 border-t border-rule flex items-center gap-2 text-sm">
          {supabaseSynced ? (
            <>
              <CloudCheck className="w-4 h-4 text-plate-green" />
              <span className="text-plate-green">ซิงค์ขึ้น Supabase แล้ว</span>
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4 text-mute" />
              <span className="text-mute">บันทึกในเครื่องแล้ว (ออฟไลน์)</span>
            </>
          )}
        </div>
    </Sheet>
  );
}
