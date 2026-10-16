'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Dumbbell, Flame, CheckCircle, CloudCheck, HardDrive } from 'lucide-react';
import { WorkoutSession } from '@/types/workout';

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
        colors: ['#22c55e', '#f97316', '#38bdf8', '#fbbf24'],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#121721] rounded-3xl border border-emerald-500/30 shadow-2xl p-6 text-center space-y-6 glow-lime">
        {/* Trophy icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Trophy className="w-10 h-10 animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            ยอดเยี่ยมมาก! 💪
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            บันทึกการฝึกซ้อมเรียบร้อยแล้ว
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-[#18202f] p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              เวลาที่ใช้
            </div>
            <div className="text-lg font-black text-white">
              {minutes} <span className="text-xs font-normal text-gray-400">นาที</span>{' '}
              {seconds} <span className="text-xs font-normal text-gray-400">วิ</span>
            </div>
          </div>

          <div className="bg-[#18202f] p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              จำนวนเซ็ตสำเร็จ
            </div>
            <div className="text-lg font-black text-emerald-400">
              {totalSetsCompleted}{' '}
              <span className="text-xs font-normal text-gray-400">เซ็ต</span>
            </div>
          </div>

          <div className="bg-[#18202f] p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              จำนวนครั้งรวม
            </div>
            <div className="text-lg font-black text-orange-400">
              {totalRepsCompleted}{' '}
              <span className="text-xs font-normal text-gray-400">ครั้ง</span>
            </div>
          </div>

          <div className="bg-[#18202f] p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
              น้ำหนักรวม (Volume)
            </div>
            <div className="text-lg font-black text-white">
              {totalVolumeKg > 0 ? (
                <>
                  {totalVolumeKg.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-gray-400">kg</span>
                </>
              ) : (
                <span className="text-xs text-gray-400">Machine Pins</span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-xl bg-white/5">
          {supabaseSynced ? (
            <>
              <CloudCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium">
                ซิงค์ข้อมูลขึ้น Supabase Cloud สำเร็จ
              </span>
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-medium">
                บันทึกลงในเครื่องเรียบร้อย (ออฟไลน์)
              </span>
            </>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition active:scale-95"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
