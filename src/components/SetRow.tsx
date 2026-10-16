'use client';

import React from 'react';
import { Check, Trash2, Plus, Minus } from 'lucide-react';
import { ExerciseSet, UnitType } from '@/types/workout';

interface SetRowProps {
  set: ExerciseSet;
  unitType: UnitType;
  onUpdate: (updates: Partial<ExerciseSet>) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export default function SetRow({
  set,
  unitType,
  onUpdate,
  onToggleComplete,
  onDelete,
}: SetRowProps) {
  const stepWeight = unitType === 'pin' ? 1 : 2.5;

  const handleWeightChange = (delta: number) => {
    const nextVal = Math.max(0, Math.round((set.weight_or_pin + delta) * 10) / 10);
    onUpdate({ weight_or_pin: nextVal });
  };

  const handleRepsChange = (delta: number) => {
    const nextReps = Math.max(1, set.reps + delta);
    onUpdate({ reps: nextReps });
  };

  return (
    <div
      className={`grid grid-cols-12 gap-2 items-center py-2 px-3 rounded-xl transition-all duration-200 border ${
        set.is_completed
          ? 'bg-emerald-950/25 border-emerald-500/20'
          : 'bg-[#0f141d]/70 hover:bg-[#151c28] border-white/5'
      }`}
    >
      {/* Set Number */}
      <div className="col-span-1 text-center font-bold text-sm text-gray-400">
        {set.set_number}
      </div>

      {/* Weight / Pin Stepper Column */}
      <div className="col-span-5 flex items-center justify-between bg-black/40 rounded-lg p-1 border border-white/5">
        <button
          type="button"
          onClick={() => handleWeightChange(-stepWeight)}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-800/80 hover:bg-gray-700 active:scale-90 text-gray-300 font-bold transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col items-center">
          <input
            type="number"
            step={stepWeight}
            value={set.weight_or_pin || ''}
            onChange={(e) =>
              onUpdate({
                weight_or_pin: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="w-14 text-center bg-transparent font-black text-base text-white focus:outline-none focus:text-emerald-400"
            placeholder="0"
          />
          <span className="text-[10px] text-gray-400 -mt-1 font-medium">
            {unitType === 'pin' ? 'แผ่นที่' : unitType === 'lbs' ? 'lbs' : 'kg'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleWeightChange(stepWeight)}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-800/80 hover:bg-gray-700 active:scale-90 text-emerald-400 font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reps Stepper Column */}
      <div className="col-span-4 flex items-center justify-between bg-black/40 rounded-lg p-1 border border-white/5">
        <button
          type="button"
          onClick={() => handleRepsChange(-1)}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-800/80 hover:bg-gray-700 active:scale-90 text-gray-300 font-bold transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col items-center">
          <input
            type="number"
            value={set.reps || ''}
            onChange={(e) =>
              onUpdate({ reps: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
            className="w-10 text-center bg-transparent font-black text-base text-white focus:outline-none focus:text-emerald-400"
            placeholder="0"
          />
          <span className="text-[10px] text-gray-400 -mt-1 font-medium">ครั้ง</span>
        </div>

        <button
          type="button"
          onClick={() => handleRepsChange(1)}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-800/80 hover:bg-gray-700 active:scale-90 text-emerald-400 font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Checkbox / Done Action */}
      <div className="col-span-2 flex items-center justify-end space-x-1.5">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all duration-200 active:scale-90 ${
            set.is_completed
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
              : 'bg-gray-800/70 border border-white/10 text-gray-400 hover:text-white hover:border-emerald-500/50'
          }`}
          title={set.is_completed ? 'เสร็จแล้ว (แตะเพื่อยกเลิก)' : 'แตะเมื่อเล่นเซ็ตนี้เสร็จ'}
        >
          <Check className="w-5 h-5 stroke-[3]" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition"
          title="ลบเซ็ต"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
