'use client';

import React from 'react';
import { Check, X, Plus, Minus } from 'lucide-react';
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

  const stepBtn =
    'w-7 h-9 shrink-0 flex items-center justify-center rounded-md text-mute hover:text-ink hover:bg-well active:bg-rule transition-colors';

  return (
    <div
      className={`flex gap-1.5 items-center py-2 px-1 transition-colors ${
        set.is_completed ? 'bg-plate-green/[0.07]' : ''
      }`}
    >
      {/* Set Number */}
      <div
        className={`w-6 shrink-0 text-center num text-lg font-semibold ${
          set.is_completed ? 'text-plate-green' : 'text-faint'
        }`}
      >
        {set.set_number}
      </div>

      {/* Weight / Pin Stepper Column */}
      <div className="flex-[5] min-w-0 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleWeightChange(-stepWeight)}
          className={stepBtn}
          aria-label="ลดน้ำหนัก"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
            type="number"
            inputMode="decimal"
            step={stepWeight}
            value={set.weight_or_pin || ''}
            onChange={(e) =>
              onUpdate({
                weight_or_pin: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="num w-full min-w-0 text-center bg-transparent text-2xl font-semibold text-ink focus:outline-none focus:text-plate-blue"
            placeholder="0"
            aria-label={unitType === 'pin' ? 'แผ่นที่' : `น้ำหนัก ${unitType}`}
          />

        <button
          type="button"
          onClick={() => handleWeightChange(stepWeight)}
          className={stepBtn}
          aria-label="เพิ่มน้ำหนัก"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Reps Stepper Column */}
      <div className="flex-[4] min-w-0 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleRepsChange(-1)}
          className={stepBtn}
          aria-label="ลดจำนวนครั้ง"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
            type="number"
            inputMode="numeric"
            value={set.reps || ''}
            onChange={(e) =>
              onUpdate({ reps: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
            className="num w-full min-w-0 text-center bg-transparent text-2xl font-semibold text-ink focus:outline-none focus:text-plate-blue"
            placeholder="0"
            aria-label="จำนวนครั้ง"
          />

        <button
          type="button"
          onClick={() => handleRepsChange(1)}
          className={stepBtn}
          aria-label="เพิ่มจำนวนครั้ง"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Done / Delete */}
      <div className="w-[66px] shrink-0 flex items-center justify-end gap-0.5">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
            set.is_completed
              ? 'bg-plate-green text-white'
              : 'border-2 border-rule text-transparent hover:border-plate-green hover:text-plate-green/50'
          }`}
          aria-pressed={set.is_completed}
          aria-label={set.is_completed ? 'เล่นเซ็ตนี้แล้ว แตะเพื่อยกเลิก' : 'แตะเมื่อเล่นเซ็ตนี้เสร็จ'}
        >
          <Check className="w-5 h-5 stroke-[3]" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-md text-faint hover:text-plate-red hover:bg-plate-red/10 transition-colors"
          aria-label="ลบเซ็ต"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
