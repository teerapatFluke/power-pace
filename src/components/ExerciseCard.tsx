'use client';

import React from 'react';
import { Plus, Trash2, TrendingUp, ChevronDown } from 'lucide-react';
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
  onApplyPreviousPerformance?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
  onApplyPreviousPerformance,
  isExpanded,
  onToggleExpand,
}: ExerciseCardProps) {
  const completedCount = exercise.sets.filter((s) => s.is_completed).length;

  const allDone = exercise.sets.length > 0 && completedCount === exercise.sets.length;
  const prev = exercise.previous_performance;

  const unitShort = (u: UnitType) => (u === 'pin' ? 'แผ่น' : u);
  const bodyId = `exercise-body-${exercise.id}`;

  return (
    <section
      className={`bg-paper rounded-lg border transition-colors ${
        isExpanded ? 'border-ink/25' : 'border-rule'
      }`}
    >
      {/* Header: tap to expand / collapse */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-ink leading-snug">
            {exercise.exercise_name}
          </h3>

          {isExpanded ? (
            <div className="mt-0.5 text-sm text-mute">{exercise.category}</div>
          ) : (
            /* Compact set summary while collapsed */
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
              {exercise.sets.length === 0 ? (
                <span className="text-faint">ยังไม่มีเซ็ต</span>
              ) : (
                exercise.sets.map((set) => (
                  <span
                    key={set.id}
                    className={`num text-base ${
                      set.is_completed ? 'text-plate-green font-semibold' : 'text-mute'
                    }`}
                  >
                    {set.weight_or_pin}
                    <span className="font-sans text-xs"> {unitShort(exercise.unit_type)}</span>
                    {' × '}
                    {set.reps}
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 pt-0.5">
          <span
            className={`num text-xl font-semibold leading-none ${
              allDone ? 'text-plate-green' : 'text-mute'
            }`}
            aria-label={`เล่นแล้ว ${completedCount} จาก ${exercise.sets.length} เซ็ต`}
          >
            {completedCount}/{exercise.sets.length}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-faint transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expandable body */}
      <div
        id={bodyId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        inert={!isExpanded}
      >
        <div className="overflow-hidden">
          {/* Previous performance + unit */}
          <div className="px-4 pb-3 flex items-center justify-between gap-3">
            {prev ? (
              <button
                type="button"
                onClick={onApplyPreviousPerformance}
                className="text-sm text-plate-blue hover:underline underline-offset-2 text-left"
                title="แตะเพื่อใช้ค่านี้กับเซ็ตที่ยังไม่ได้เล่น"
              >
                ครั้งก่อนที่นี่{' '}
                <span className="num font-semibold text-base">
                  {prev.weight_or_pin} {unitShort(prev.unit_type)} × {prev.reps}
                </span>
              </button>
            ) : (
              <span className="text-sm text-faint">ยังไม่มีสถิติที่นี่</span>
            )}

            <div className="shrink-0 flex rounded-md border border-rule text-xs overflow-hidden">
              {(['pin', 'kg', 'lbs'] as UnitType[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onUpdateExercise({ unit_type: u })}
                  aria-pressed={exercise.unit_type === u}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    exercise.unit_type === u
                      ? 'bg-ink text-paper'
                      : 'text-mute hover:bg-well'
                  }`}
                >
                  {unitShort(u)}
                </button>
              ))}
            </div>
          </div>

          {/* Column headings */}
          <div className="flex gap-1.5 px-4 pb-1 text-xs text-faint border-b border-rule">
            <div className="w-6 shrink-0 text-center">เซ็ต</div>
            <div className="flex-[5] text-center">
              {exercise.unit_type === 'pin' ? 'แผ่นที่' : `น้ำหนัก ${exercise.unit_type}`}
            </div>
            <div className="flex-[4] text-center">ครั้ง</div>
            <div className="w-[66px] shrink-0" />
          </div>

          {/* Set Rows */}
          <div className="px-3 divide-y divide-rule/70">
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

          {/* Actions */}
          <div className="px-4 py-3 border-t border-rule flex items-center gap-2">
            <button
              type="button"
              onClick={onAddSet}
              className="px-3 py-2 rounded-md border border-rule text-sm font-medium text-ink hover:bg-well flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่มเซ็ต
            </button>

            <button
              type="button"
              onClick={onApplyProgressiveSet}
              className="px-3 py-2 rounded-md border border-rule text-sm font-medium text-ink hover:bg-well flex items-center gap-1.5 transition-colors"
              title="เพิ่มเซ็ตที่หนักขึ้นหนึ่งขั้น และลดจำนวนครั้งลง 2"
            >
              <TrendingUp className="w-4 h-4" />
              เซ็ตหนักขึ้น
            </button>

            <button
              type="button"
              onClick={onRemoveExercise}
              className="ml-auto p-2 rounded-md text-faint hover:text-plate-red hover:bg-plate-red/10 transition-colors"
              aria-label="ลบท่านี้ออก"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
