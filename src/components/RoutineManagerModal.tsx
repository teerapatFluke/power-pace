'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Check,
  Dumbbell,
  Layers,
  Edit2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { RoutinePreset } from '@/lib/workoutRoutines';
import { Exercise } from '@/types/workout';

interface RoutineManagerModalProps {
  isOpen: boolean;
  routines: RoutinePreset[];
  allExercises: Exercise[];
  onClose: () => void;
  onSaveRoutines: (updatedRoutines: RoutinePreset[]) => void;
  onStartRoutine: (routine: RoutinePreset) => void;
  onResetToDefault: () => void;
}

export default function RoutineManagerModal({
  isOpen,
  routines,
  allExercises,
  onClose,
  onSaveRoutines,
  onStartRoutine,
  onResetToDefault,
}: RoutineManagerModalProps) {
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [addingExerciseToRoutineId, setAddingExerciseToRoutineId] = useState<string | null>(null);
  const [isCreatingNewRoutine, setIsCreatingNewRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDay, setNewRoutineDay] = useState('');
  const [newRoutineFocus, setNewRoutineFocus] = useState('');

  if (!isOpen) return null;

  const getExerciseById = (id: string) => allExercises.find((ex) => ex.id === id);

  // Reorder exercises inside a routine
  const handleMoveExercise = (routineId: string, index: number, direction: 'up' | 'down') => {
    const targetRoutine = routines.find((r) => r.id === routineId);
    if (!targetRoutine) return;

    const newExerciseIds = [...targetRoutine.exerciseIds];
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= newExerciseIds.length) return;

    const temp = newExerciseIds[index];
    newExerciseIds[index] = newExerciseIds[newIdx];
    newExerciseIds[newIdx] = temp;

    const updated = routines.map((r) =>
      r.id === routineId ? { ...r, exerciseIds: newExerciseIds } : r
    );
    onSaveRoutines(updated);
  };

  // Remove exercise from routine
  const handleRemoveExercise = (routineId: string, exId: string) => {
    const updated = routines.map((r) => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        exerciseIds: r.exerciseIds.filter((id) => id !== exId),
      };
    });
    onSaveRoutines(updated);
  };

  // Add exercise to routine
  const handleAddExerciseToRoutine = (routineId: string, exId: string) => {
    const updated = routines.map((r) => {
      if (r.id !== routineId) return r;
      if (r.exerciseIds.includes(exId)) return r;
      return {
        ...r,
        exerciseIds: [...r.exerciseIds, exId],
      };
    });
    onSaveRoutines(updated);
    setAddingExerciseToRoutineId(null);
  };

  // Delete an entire routine day
  const handleDeleteRoutine = (routineId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตารางวันนี้?')) {
      const updated = routines.filter((r) => r.id !== routineId);
      onSaveRoutines(updated);
    }
  };

  // Create new routine day
  const handleCreateNewRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    const newRoutine: RoutinePreset = {
      id: `routine-${Date.now()}`,
      name: newRoutineName.trim(),
      day: newRoutineDay.trim() || 'วันใหม่',
      focus: newRoutineFocus.trim() || 'กำหนดเอง',
      exerciseIds: [],
    };

    onSaveRoutines([...routines, newRoutine]);
    setNewRoutineName('');
    setNewRoutineDay('');
    setNewRoutineFocus('');
    setIsCreatingNewRoutine(false);
    setEditingRoutineId(newRoutine.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-xl bg-[#121721] rounded-t-3xl sm:rounded-3xl border border-[#1f2737] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">
              จัดการตารางออกกำลังกายแต่ละวัน
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {routines.map((routine) => {
            const isEditing = editingRoutineId === routine.id;

            return (
              <div
                key={routine.id}
                className={`rounded-2xl border transition-all ${
                  isEditing
                    ? 'bg-[#161d2a] border-emerald-500/40 shadow-lg'
                    : 'bg-[#141a26] border-white/5 hover:border-white/10'
                }`}
              >
                {/* Routine Card Header */}
                <div className="p-3.5 flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setEditingRoutineId(isEditing ? null : routine.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">
                        {routine.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {routine.exerciseIds.length} ท่า
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {routine.focus}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 ml-2">
                    {/* Start Routine Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onStartRoutine(routine);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                      title="เริ่มเล่นตารางวันนี้"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      เล่น
                    </button>

                    {/* Edit Toggle */}
                    <button
                      type="button"
                      onClick={() => setEditingRoutineId(isEditing ? null : routine.id)}
                      className={`p-1.5 rounded-xl transition ${
                        isEditing
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title={isEditing ? 'ปิดการแก้ไข' : 'แก้ไขรายการท่า'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Routine */}
                    <button
                      type="button"
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="ลบตารางวันนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Routine Details / Editor */}
                {isEditing && (
                  <div className="p-3.5 pt-0 border-t border-white/5 space-y-2 mt-1">
                    <div className="text-xs font-bold text-gray-400 pt-2 flex items-center justify-between">
                      <span>รายการท่าในตารางนี้:</span>
                      <button
                        type="button"
                        onClick={() => setAddingExerciseToRoutineId(routine.id)}
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มท่าลงในวันนี้
                      </button>
                    </div>

                    {/* Exercise List */}
                    {routine.exerciseIds.length === 0 ? (
                      <div className="text-xs text-gray-500 py-2 text-center">
                        ยังไม่มีท่าในตารางนี้ กด &quot;เพิ่มท่าลงในวันนี้&quot; เพื่อเลือกท่า
                      </div>
                    ) : (
                      routine.exerciseIds.map((exId, idx) => {
                        const ex = getExerciseById(exId);
                        const displayName = ex ? ex.name : exId;
                        const unitType = ex ? ex.unit_type : 'kg';

                        return (
                          <div
                            key={`${routine.id}-${exId}-${idx}`}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#0e131d] border border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                              <span className="font-bold text-gray-400 w-4 text-center">
                                {idx + 1}
                              </span>
                              <span className="text-gray-200 truncate font-medium">
                                {displayName}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                  unitType === 'pin'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {unitType === 'pin' ? 'แผ่น' : 'kg'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveExercise(routine.id, idx, 'up')}
                                className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                title="เลื่อนขึ้น"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={idx === routine.exerciseIds.length - 1}
                                onClick={() => handleMoveExercise(routine.id, idx, 'down')}
                                className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                title="เลื่อนลง"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(routine.id, exId)}
                                className="p-1 rounded text-gray-500 hover:text-red-400 ml-1"
                                title="ลบท่านี้ออกจากตาราง"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Routine Button */}
          {!isCreatingNewRoutine ? (
            <button
              type="button"
              onClick={() => setIsCreatingNewRoutine(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มตารางวันใหม่ (เช่น วันพฤหัสบดี, วันอาทิตย์)
            </button>
          ) : (
            <form
              onSubmit={handleCreateNewRoutine}
              className="bg-[#161d2a] p-4 rounded-2xl border border-emerald-500/30 space-y-3"
            >
              <div className="font-bold text-xs text-white">สร้างตารางวันใหม่</div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">ชื่อตาราง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น พฤหัสบดี (Arms & Abs) หรือ Full Body"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e131d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">
                  เน้นมัดกล้ามเนื้อ (Focus)
                </label>
                <input
                  type="text"
                  placeholder="เช่น แขนหน้า, แขนหลัง, หน้าท้อง"
                  value={newRoutineFocus}
                  onChange={(e) => setNewRoutineFocus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e131d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewRoutine(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold"
                >
                  บันทึกตารางใหม่
                </button>
              </div>
            </form>
          )}

          {/* Reset button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตตารางทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
                  onResetToDefault();
                }
              }}
              className="text-xs text-gray-500 hover:text-amber-400 transition inline-flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              รีเซ็ตกลับเป็นตารางมาตรฐานเริ่มต้น (Push/Pull/Legs/Upper/Lower)
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal for Routine Day */}
      {addingExerciseToRoutineId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#121721] rounded-3xl border border-[#1f2737] shadow-2xl p-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="font-bold text-sm text-white">
                เลือกท่าเพื่อเพิ่มลงในตาราง
              </div>
              <button
                type="button"
                onClick={() => setAddingExerciseToRoutineId(null)}
                className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1.5 no-scrollbar">
              {allExercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleAddExerciseToRoutine(addingExerciseToRoutineId, ex.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#161d2a] hover:bg-[#1f293a] text-left border border-white/5 transition"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{ex.name}</div>
                    <div className="text-[10px] text-gray-400">{ex.category}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      ex.unit_type === 'pin'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {ex.unit_type === 'pin' ? 'แผ่น' : 'kg'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
