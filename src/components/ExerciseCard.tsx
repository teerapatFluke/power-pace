'use client';

import React from 'react';
import { Plus, Trash2, Zap, Dumbbell, Layers } from 'lucide-react';
import { WorkoutExercise, ExerciseSet, UnitType } from '@/types/workout';
import SetRow from './SetRow';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onUpdateExercise: (updates: Partial<WorkoutExercise>) => void;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  onToggleCompleteSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
  onApplyProgressiveSet: () => void;
}

export default function ExerciseCard({
  exercise,
  onUpdateExercise,
  onRemoveExercise,
  onAddSet,
  onUpdateSet,
  onToggleCompleteSet,
  onDeleteSet,
  onApplyProgressiveSet,
}: ExerciseCardProps) {
  const completedCount = exercise.sets.filter((s) => s.is_completed).length;

  return (
    <div className="bg-[#121721] rounded-2xl p-4 border border-[#1f2737] shadow-lg transition-all">
      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              {exercise.unit_type === 'pin' ? (
                <Layers className="w-4 h-4" />
              ) : (
                <Dumbbell className="w-4 h-4" />
              )}
            </span>
            <h3 className="font-bold text-base text-white tracking-tight">
              {exercise.exercise_name}
            </h3>
          </div>

          {/* Muscle category & previous performance */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-medium">
              {exercise.category}
            </span>

            {exercise.previous_performance && (
              <span
                className={`font-medium flex items-center gap-1 ${
                  exercise.previous_performance.is_from_current_location
                    ? 'text-amber-400/90'
                    : 'text-sky-400/90'
                }`}
                title={
                  exercise.previous_performance.is_from_current_location
                    ? 'สถิติล่าสุดจากสถานที่นี้'
                    : `สถิติล่าสุดจาก: ${exercise.previous_performance.location_name || 'ที่อื่น'}`
                }
              >
                <span>
                  ⚡ {exercise.previous_performance.is_from_current_location ? 'คราวก่อน' : `เคยเล่นที่ ${exercise.previous_performance.location_name || 'อื่น'}`}:
                </span>
                <span className="font-bold">
                  {exercise.previous_performance.weight_or_pin}{' '}
                  {exercise.previous_performance.unit_type === 'pin' ? 'แผ่น' : 'kg'} ×{' '}
                  {exercise.previous_performance.reps} ครั้ง
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Unit Type Segmented Control */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/5 text-xs">
          {(['pin', 'kg', 'lbs'] as UnitType[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onUpdateExercise({ unit_type: u })}
              className={`px-2 py-1 rounded-md font-semibold transition ${
                exercise.unit_type === u
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {u === 'pin' ? 'แผ่น' : u}
            </button>
          ))}
        </div>
      </div>

      {/* Sets Header Titles */}
      <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider border-b border-white/5 mb-1">
        <div className="col-span-1 text-center">Set</div>
        <div className="col-span-5 text-center">
          {exercise.unit_type === 'pin' ? 'แผ่นที่' : 'น้ำหนัก'}
        </div>
        <div className="col-span-4 text-center">จำนวนครั้ง</div>
        <div className="col-span-2 text-right">เสร็จ</div>
      </div>

      {/* Set Rows */}
      <div className="space-y-1.5 my-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            unitType={exercise.unit_type}
            onUpdate={(updates) => onUpdateSet(set.id, updates)}
            onToggleComplete={() => onToggleCompleteSet(set.id)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>

      {/* Bottom Action Buttons */}
      <div className="pt-2 mt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Add Normal Set */}
          <button
            type="button"
            onClick={onAddSet}
            className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-95 text-xs font-bold text-white flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            เพิ่มเซ็ต
          </button>

          {/* Progressive Overload Auto-Set */}
          <button
            type="button"
            onClick={onApplyProgressiveSet}
            className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition border border-orange-500/20"
            title="เพิ่มเซ็ตที่หนักขึ้น และลด reps ลงตามหลัก Progressive Overload"
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            + Progressive Set
          </button>
        </div>

        {/* Remove Exercise */}
        <button
          type="button"
          onClick={onRemoveExercise}
          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition"
          title="ลบท่านี้ออกจาก Workout"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress status bar */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span>ความคืบหน้า</span>
        <span className="font-semibold text-emerald-400">
          {completedCount} / {exercise.sets.length} เซ็ต
        </span>
      </div>
    </div>
  );
}
