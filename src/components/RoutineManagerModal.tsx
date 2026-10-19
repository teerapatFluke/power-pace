'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Edit2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  Search,
  Layers,
  Dumbbell,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  RoutinePreset,
  DAYS_OF_WEEK,
  PROGRAM_TEMPLATES,
  ProgramTemplate,
  swapRoutineDays,
} from '@/lib/workoutRoutines';
import { Exercise, MuscleCategory } from '@/types/workout';
import { findExerciseMatch, saveLocalCustomExercise } from '@/lib/storage';
import Sheet from './Sheet';

const CATEGORIES: MuscleCategory[] = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
];

const CATEGORY_NAMES_TH: Record<MuscleCategory, string> = {
  All: 'ทั้งหมด',
  Chest: 'อก',
  Back: 'หลัง',
  Legs: 'ขา',
  Shoulders: 'ไหล่',
  Arms: 'แขน',
  Core: 'ท้อง',
};

interface RoutineManagerModalProps {
  isOpen: boolean;
  routines: RoutinePreset[];
  allExercises: Exercise[];
  onClose: () => void;
  onSaveRoutines: (updatedRoutines: RoutinePreset[]) => void;
  onStartRoutine: (routine: RoutinePreset) => void;
  onResetToDefault: () => void;
  onCreateCustomExercise?: (newExercise: Exercise) => Promise<Exercise>;
}

export default function RoutineManagerModal({
  isOpen,
  routines,
  allExercises,
  onClose,
  onSaveRoutines,
  onStartRoutine,
  onResetToDefault,
  onCreateCustomExercise,
}: RoutineManagerModalProps) {
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [addingExerciseToRoutineId, setAddingExerciseToRoutineId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState<MuscleCategory>('All');
  const [pickerUnit, setPickerUnit] = useState<'all' | 'pin' | 'kg'>('all');
  const [isCreatingNewRoutine, setIsCreatingNewRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDay, setNewRoutineDay] = useState<string>(DAYS_OF_WEEK[0]);
  const [newRoutineFocus, setNewRoutineFocus] = useState('');

  // Custom Exercise creation states inside picker
  const [isCreatingExerciseInPicker, setIsCreatingExerciseInPicker] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExCategory, setCustomExCategory] = useState<MuscleCategory>('Chest');
  const [customExUnit, setCustomExUnit] = useState<'pin' | 'kg'>('pin');
  const [isSavingCustomEx, setIsSavingCustomEx] = useState(false);

  // Drag and drop & swap states
  const [draggingRoutineId, setDraggingRoutineId] = useState<string | null>(null);
  const [dragOverRoutineId, setDragOverRoutineId] = useState<string | null>(null);
  const [swappingTargetRoutine, setSwappingTargetRoutine] = useState<RoutinePreset | null>(null);
  const [swapToast, setSwapToast] = useState<string | null>(null);

  const handleSwapRoutines = (idA: string, idB: string) => {
    if (idA === idB) return;
    const routineA = routines.find((r) => r.id === idA);
    const routineB = routines.find((r) => r.id === idB);
    const updated = swapRoutineDays(routines, idA, idB);
    onSaveRoutines(updated);
    if (routineA && routineB) {
      setSwapToast(`สลับวันเล่นสำเร็จ: ${routineA.day} ⇄ ${routineB.day}`);
      setTimeout(() => setSwapToast(null), 3500);
    }
  };

  if (!isOpen) return null;

  const getExerciseById = (id: string) => findExerciseMatch(allExercises, id);

  // Update routine name, day, or focus
  const handleUpdateRoutineDetails = (
    routineId: string,
    updates: Partial<RoutinePreset>
  ) => {
    const updated = routines.map((r) =>
      r.id === routineId ? { ...r, ...updates } : r
    );
    onSaveRoutines(updated);
  };

  // Apply a standard program template
  const handleApplyTemplate = (template: ProgramTemplate) => {
    if (
      confirm(
        `ต้องการเปลี่ยนตารางฝึกทั้งหมดเป็น "${template.name}" (${template.daysCount} วัน) หรือไม่?`
      )
    ) {
      onSaveRoutines(template.routines);
      setEditingRoutineId(null);
    }
  };

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
      day: newRoutineDay.trim() || DAYS_OF_WEEK[0],
      focus: newRoutineFocus.trim() || 'กำหนดเอง',
      exerciseIds: [],
    };

    onSaveRoutines([...routines, newRoutine]);
    setNewRoutineName('');
    setNewRoutineDay(DAYS_OF_WEEK[0]);
    setNewRoutineFocus('');
    setIsCreatingNewRoutine(false);
    setEditingRoutineId(newRoutine.id);
  };

  return (
    <>
    <Sheet
      title="ตารางฝึกซ้อม"
      description="ปรับแต่งตารางของตัวเอง เลือกโปรแกรม หรือเปลี่ยนชื่อท่า/วันได้อิสระ"
      onClose={onClose}
    >
        <div>
          {/* Quick Program Templates Selector */}
          <div className="p-4 bg-well/30 border-b border-rule">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-plate-blue" />
              เลือกรูปแบบโปรแกรมฝึกยอดนิยม
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROGRAM_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2.5 bg-paper hover:bg-well border border-rule rounded-lg text-left transition-all hover:border-plate-blue/50 flex flex-col justify-between group"
                >
                  <div>
                    <div className="text-xs font-semibold text-ink group-hover:text-plate-blue transition-colors">
                      {tmpl.name}
                    </div>
                    <div className="text-[11px] text-mute line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-plate-blue bg-plate-blue/10 rounded px-1.5 py-0.5 w-fit">
                    {tmpl.badge}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Reorder & Swap Hint */}
          <div className="px-4 py-2 bg-well/40 border-b border-rule flex items-center justify-between text-xs text-mute">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-plate-blue shrink-0" />
              <span>ลากการ์ดเพื่อสลับวัน หรือแตะปุ่ม <ArrowUpDown className="w-3 h-3 inline text-ink mx-0.5" /> เพื่อเลือกวันสลับ</span>
            </span>
            <span className="text-[11px] text-faint shrink-0">{routines.length} ตาราง</span>
          </div>

          {/* Swap Success Toast */}
          {swapToast && (
            <div className="mx-4 my-2 px-3 py-2 bg-plate-green/10 border border-plate-green/30 text-plate-green text-xs font-semibold rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <Check className="w-4 h-4 shrink-0" />
              <span>{swapToast}</span>
            </div>
          )}

          <div className="divide-y divide-rule border-b border-rule">
            {routines.map((routine) => {
              const isEditing = editingRoutineId === routine.id;
              const isDragging = draggingRoutineId === routine.id;
              const isDragOver = dragOverRoutineId === routine.id;

              return (
                <div
                  key={routine.id}
                  draggable={!isEditing}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', routine.id);
                    setDraggingRoutineId(routine.id);
                  }}
                  onDragEnd={() => {
                    setDraggingRoutineId(null);
                    setDragOverRoutineId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingRoutineId && draggingRoutineId !== routine.id) {
                      setDragOverRoutineId(routine.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverRoutineId === routine.id) {
                      setDragOverRoutineId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const srcId = e.dataTransfer.getData('text/plain') || draggingRoutineId;
                    if (srcId && srcId !== routine.id) {
                      handleSwapRoutines(srcId, routine.id);
                    }
                    setDraggingRoutineId(null);
                    setDragOverRoutineId(null);
                  }}
                  className={`transition-all select-none ${
                    isDragging
                      ? 'opacity-30 border-2 border-dashed border-plate-blue'
                      : isDragOver
                      ? 'bg-plate-blue/10 ring-2 ring-plate-blue shadow-md'
                      : isEditing
                      ? 'bg-well/50'
                      : 'hover:bg-well/30'
                  }`}
                >
                  {/* Drop Notice Banner */}
                  {isDragOver && (
                    <div className="px-4 py-1.5 bg-plate-blue text-white text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>ปล่อยเพื่อสลับวันกับ &ldquo;{routine.day} ({routine.name})&rdquo;</span>
                    </div>
                  )}

                  {/* Routine Card Header */}
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    {/* Drag Handle */}
                    {!isEditing && (
                      <div
                        className="p-1 -ml-1 text-faint hover:text-ink cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                        title="คลิกค้างแล้วลากเพื่อสลับวัน"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setEditingRoutineId(isEditing ? null : routine.id)}
                    >
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-xs font-semibold text-plate-blue bg-plate-blue/10 px-2 py-0.5 rounded-full shrink-0">
                          {routine.day}
                        </span>
                        <span className="font-semibold text-ink text-base truncate">
                          {routine.name}
                        </span>
                        <span className="text-sm text-mute shrink-0">
                          <span className="num">{routine.exerciseIds.length}</span> ท่า
                        </span>
                      </div>
                      <div className="text-sm text-mute mt-0.5">
                        {routine.focus}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {/* Start Routine Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onStartRoutine(routine);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-md bg-plate-blue hover:bg-plate-blue-dark text-white font-semibold text-sm flex items-center gap-1 shadow-2xs"
                        title="เริ่มเล่นตารางวันนี้"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        เล่น
                      </button>

                      {/* Quick Swap Days Button */}
                      <button
                        type="button"
                        onClick={() => setSwappingTargetRoutine(routine)}
                        className="p-2 rounded-md text-mute hover:text-plate-blue hover:bg-well transition-colors"
                        title="สลับวันกับตารางอื่น"
                        aria-label="สลับวันกับตารางอื่น"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>

                      {/* Edit Toggle */}
                      <button
                        type="button"
                        onClick={() => setEditingRoutineId(isEditing ? null : routine.id)}
                        className={`p-2 rounded-md ${
                          isEditing
                            ? 'bg-ink text-paper'
                            : 'text-mute hover:text-ink hover:bg-well'
                        }`}
                        title={isEditing ? 'ปิดการแก้ไข' : 'แก้ไขชื่อ/วัน/รายการท่า'}
                        aria-label={isEditing ? 'ปิดการแก้ไข' : 'แก้ไขชื่อ/วัน/รายการท่า'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Routine */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="p-2 rounded-md text-faint hover:text-plate-red hover:bg-plate-red/10"
                        title="ลบตารางวันนี้"
                        aria-label="ลบตารางวันนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Routine Details / Editor */}
                  {isEditing && (
                    <div className="px-4 pb-3 space-y-3">
                      {/* Edit Routine Day & Name & Focus */}
                      <div className="p-3 bg-paper rounded-lg border border-rule space-y-2.5 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-mute block mb-1">
                              วันในสัปดาห์
                            </label>
                            <select
                              value={routine.day}
                              onChange={(e) =>
                                handleUpdateRoutineDetails(routine.id, {
                                  day: e.target.value,
                                })
                              }
                              className="w-full bg-well border border-rule rounded-md px-2.5 py-1.5 text-ink text-sm focus:outline-none focus:border-plate-blue font-medium"
                            >
                              {DAYS_OF_WEEK.map((d) => (
                                <option key={d} value={d}>
                                  วัน{d}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-mute block mb-1">
                              ชื่อตารางฝึก (ปรับชื่อตามใจชอบ)
                            </label>
                            <input
                              type="text"
                              value={routine.name}
                              onChange={(e) =>
                                handleUpdateRoutineDetails(routine.id, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="เช่น จันทร์ (Push) หรือ Full Body A หรือ อก + หลัง"
                              className="w-full bg-well border border-rule rounded-md px-2.5 py-1.5 text-ink text-sm focus:outline-none focus:border-plate-blue font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-mute block mb-1">
                            กล้ามเนื้อที่เน้น / โฟกัส
                          </label>
                          <input
                            type="text"
                            value={routine.focus}
                            onChange={(e) =>
                              handleUpdateRoutineDetails(routine.id, {
                                focus: e.target.value,
                              })
                            }
                            placeholder="เช่น อกกลาง, อกบน, ไหล่หน้า..."
                            className="w-full bg-well border border-rule rounded-md px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-plate-blue"
                          />
                        </div>
                      </div>

                      <div className="text-sm text-mute pt-1 flex items-center justify-between">
                        <span>ท่าในตารางนี้ ({routine.exerciseIds.length} ท่า)</span>
                        <button
                          type="button"
                          onClick={() => setAddingExerciseToRoutineId(routine.id)}
                          className="text-plate-blue hover:underline flex items-center gap-1 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          เพิ่มท่า
                        </button>
                      </div>

                      {/* Exercise List */}
                      {routine.exerciseIds.length === 0 ? (
                        <div className="text-sm text-mute py-3">
                          ยังไม่มีท่าในตารางนี้ กด &quot;เพิ่มท่า&quot; เพื่อเลือก
                        </div>
                      ) : (
                        <div className="divide-y divide-rule border-y border-rule">
                          {routine.exerciseIds.map((exId, idx) => {
                            const ex = getExerciseById(exId);
                            const displayName = ex ? ex.name : exId;
                            const unitType = ex ? ex.unit_type : 'kg';

                            return (
                              <div
                                key={`${routine.id}-${exId}-${idx}`}
                                className="flex items-center justify-between py-1.5 text-sm"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                  <span className="num text-faint w-4 text-right">
                                    {idx + 1}
                                  </span>
                                  <span className="text-ink truncate">
                                    {displayName}
                                  </span>
                                  <span className="text-xs text-mute shrink-0">
                                    {unitType === 'pin' ? 'แผ่น' : 'kg'}
                                  </span>
                                </div>

                                <div className="flex items-center">
                                  {/* Move Up */}
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveExercise(routine.id, idx, 'up')}
                                    className="p-1.5 rounded-md text-mute hover:text-ink hover:bg-well disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="เลื่อนขึ้น"
                                    aria-label="เลื่อนขึ้น"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Move Down */}
                                  <button
                                    type="button"
                                    disabled={idx === routine.exerciseIds.length - 1}
                                    onClick={() => handleMoveExercise(routine.id, idx, 'down')}
                                    className="p-1.5 rounded-md text-mute hover:text-ink hover:bg-well disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="เลื่อนลง"
                                    aria-label="เลื่อนลง"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Remove */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExercise(routine.id, exId)}
                                    className="p-1.5 ml-1 rounded-md text-faint hover:text-plate-red hover:bg-plate-red/10"
                                    title="ลบท่านี้ออกจากตาราง"
                                    aria-label="ลบท่านี้ออกจากตาราง"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 space-y-4">
            {/* Add New Routine Button */}
            {!isCreatingNewRoutine ? (
              <button
                type="button"
                onClick={() => setIsCreatingNewRoutine(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-plate-blue hover:underline"
              >
                <Plus className="w-4 h-4" />
                เพิ่มตารางวันใหม่
              </button>
            ) : (
              <form onSubmit={handleCreateNewRoutine} className="space-y-3">
                <div className="font-semibold text-base text-ink">สร้างตารางวันใหม่</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm text-mute mb-1 block">วันในสัปดาห์</label>
                    <select
                      value={newRoutineDay}
                      onChange={(e) => setNewRoutineDay(e.target.value)}
                      className="w-full bg-paper border border-rule rounded-md px-3 py-2 text-ink text-sm focus:outline-none focus:border-plate-blue font-medium"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          วัน{d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-mute mb-1 block">ชื่อตาราง</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น พฤหัสบดี (Arms & Abs) หรือ Full Body"
                      value={newRoutineName}
                      onChange={(e) => setNewRoutineName(e.target.value)}
                      className="w-full bg-paper border border-rule rounded-md px-3 py-2 text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-mute mb-1 block">
                    เน้นกล้ามเนื้อส่วนไหน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น แขนหน้า, แขนหลัง, หน้าท้อง"
                    value={newRoutineFocus}
                    onChange={(e) => setNewRoutineFocus(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-md px-3 py-2 text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewRoutine(false)}
                    className="flex-1 px-4 py-2.5 border border-rule bg-paper text-ink text-sm rounded-md hover:bg-well"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-plate-blue text-white text-sm font-semibold rounded-md hover:bg-plate-blue-dark"
                  >
                    บันทึกตารางใหม่
                  </button>
                </div>
              </form>
            )}

            {/* Reset button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการรีเซ็ตตารางทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
                    onResetToDefault();
                  }
                }}
                className="text-sm text-mute hover:text-plate-red inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ตเป็นตารางเริ่มต้น (Push, Pull, Legs, Upper, Lower)
              </button>
            </div>
          </div>
        </div>
    </Sheet>

      {/* Exercise Picker Modal for Routine Day */}
      {addingExerciseToRoutineId && (() => {
        const targetRoutine = routines.find((r) => r.id === addingExerciseToRoutineId);
        const existingIds = targetRoutine ? targetRoutine.exerciseIds : [];
        const pickerTokens = pickerSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);

        const filteredPickerExercises = allExercises.filter((ex) => {
          if (pickerCategory !== 'All' && ex.category !== pickerCategory) return false;
          if (pickerUnit === 'pin' && ex.unit_type !== 'pin') return false;
          if (pickerUnit === 'kg' && ex.unit_type !== 'kg' && ex.unit_type !== 'bodyweight') return false;
          if (pickerTokens.length === 0) return true;

          const catTh = CATEGORY_NAMES_TH[ex.category] || '';
          const unitKeywords =
            ex.unit_type === 'pin'
              ? 'แผ่น machine เครื่อง pin stack'
              : 'กิโล kg ดัมเบล dumbbell บาร์เบล barbell ฟรีเวท freeweight';
          const searchable = `${ex.name} ${ex.category} ${catTh} ${ex.unit_type} ${unitKeywords}`.toLowerCase();
          return pickerTokens.every((t) => searchable.includes(t));
        });

        return (
          <Sheet
            title={isCreatingExerciseInPicker ? 'สร้างท่าใหม่ลงตาราง' : 'เลือกท่าที่จะเพิ่ม'}
            description={
              isCreatingExerciseInPicker
                ? targetRoutine
                  ? `จะเพิ่มลงในตาราง: ${targetRoutine.name} อัตโนมัติ`
                  : 'บันทึกเข้าสู่ระบบ Supabase'
                : targetRoutine
                ? `เพิ่มลงในตาราง: ${targetRoutine.name}`
                : undefined
            }
            onClose={() => {
              setAddingExerciseToRoutineId(null);
              setPickerSearch('');
              setIsCreatingExerciseInPicker(false);
              setCustomExName('');
            }}
            size="md"
            stacked
          >
            {isCreatingExerciseInPicker ? (
              /* Custom Exercise Creation Form inside Routine Picker */
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!customExName.trim() || !addingExerciseToRoutineId) return;

                  setIsSavingCustomEx(true);
                  try {
                    const newEx: Exercise = {
                      id: `custom-${Date.now()}`,
                      name: customExName.trim(),
                      category: customExCategory,
                      unit_type: customExUnit,
                      custom: true,
                    };

                    let savedEx = newEx;
                    if (onCreateCustomExercise) {
                      savedEx = await onCreateCustomExercise(newEx);
                    } else {
                      savedEx = await saveLocalCustomExercise(newEx);
                    }

                    // Add to current routine immediately
                    handleAddExerciseToRoutine(addingExerciseToRoutineId, savedEx.id);

                    // Clean up
                    setIsCreatingExerciseInPicker(false);
                    setCustomExName('');
                    setPickerSearch('');
                  } catch (err) {
                    console.error('Failed to create custom exercise:', err);
                  } finally {
                    setIsSavingCustomEx(false);
                  }
                }}
                className="p-5 space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-mute uppercase tracking-wider mb-1.5 block">
                    ชื่อท่าฝึก (Exercise Name)
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="เช่น Incline Cable Fly, Hack Squat"
                    value={customExName}
                    onChange={(e) => setCustomExName(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-md px-3.5 py-2.5 text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-mute uppercase tracking-wider mb-1.5 block">
                    ส่วนกล้ามเนื้อ (Category)
                  </label>
                  <select
                    value={customExCategory}
                    onChange={(e) => setCustomExCategory(e.target.value as MuscleCategory)}
                    className="w-full bg-paper border border-rule rounded-md px-3.5 py-2.5 text-ink text-sm focus:outline-none focus:border-plate-blue"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_NAMES_TH[c]} ({c})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-mute uppercase tracking-wider mb-1.5 block">
                    ประเภทเครื่อง / น้ำหนัก
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-well rounded-md">
                    <button
                      type="button"
                      onClick={() => setCustomExUnit('pin')}
                      className={`py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        customExUnit === 'pin'
                          ? 'bg-ink text-paper font-semibold shadow-xs'
                          : 'text-mute hover:text-ink'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      เครื่อง / แผ่นเหล็ก (Pin)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomExUnit('kg')}
                      className={`py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        customExUnit === 'kg'
                          ? 'bg-ink text-paper font-semibold shadow-xs'
                          : 'text-mute hover:text-ink'
                      }`}
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      ฟรีเวท (กิโลกรัม / kg)
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={isSavingCustomEx}
                    onClick={() => {
                      setIsCreatingExerciseInPicker(false);
                      setCustomExName('');
                    }}
                    className="flex-1 py-2.5 rounded-md border border-rule text-xs font-medium text-mute hover:text-ink transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCustomEx || !customExName.trim()}
                    className="flex-1 py-2.5 rounded-md bg-plate-blue hover:bg-plate-blue-dark text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    {isSavingCustomEx ? 'กำลังบันทึก...' : 'บันทึก & เพิ่มเข้าตาราง'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Search & Filter Bar */}
                <div className="sticky top-0 z-10 bg-paper px-4 pt-3 pb-2.5 space-y-2 border-b border-rule">
                  {/* Search Box */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ค้นหาท่า, ส่วนกล้ามเนื้อ, แผ่น, kg..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-paper border border-rule rounded-md text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
                    />
                    {pickerSearch && (
                      <button
                        type="button"
                        onClick={() => setPickerSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-well text-mute hover:text-ink text-xs"
                        title="ล้างคำค้นหา"
                        aria-label="ล้างคำค้นหา"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Chips */}
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPickerCategory(cat)}
                        className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                          pickerCategory === cat
                            ? 'bg-ink text-paper font-medium'
                            : 'text-mute hover:bg-well'
                        }`}
                      >
                        {CATEGORY_NAMES_TH[cat]}
                      </button>
                    ))}
                  </div>

                  {/* Unit filters & counter */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPickerUnit('all')}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          pickerUnit === 'all'
                            ? 'bg-well text-ink font-semibold'
                            : 'text-mute hover:text-ink'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerUnit('pin')}
                        className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                          pickerUnit === 'pin'
                            ? 'bg-well text-plate-blue font-semibold'
                            : 'text-mute hover:text-ink'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        เครื่อง (แผ่น)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerUnit('kg')}
                        className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                          pickerUnit === 'kg'
                            ? 'bg-well text-plate-blue font-semibold'
                            : 'text-mute hover:text-ink'
                        }`}
                      >
                        <Dumbbell className="w-3 h-3" />
                        ฟรีเวท (kg)
                      </button>
                    </div>

                    <span className="text-faint text-[11px]">
                      {filteredPickerExercises.length} / {allExercises.length} ท่า
                    </span>
                  </div>
                </div>

                {/* List */}
                {filteredPickerExercises.length === 0 ? (
                  <div className="px-4 py-10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-well flex items-center justify-center mx-auto text-mute">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        ไม่พบท่าที่ตรงกับ &ldquo;{pickerSearch}&rdquo;
                      </p>
                      <p className="text-xs text-mute mt-1">
                        สร้างท่าฝึกใหม่นี้เพื่อบันทึกลงฐานข้อมูลและเพิ่มเข้าตารางทันที
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      {pickerSearch && (
                        <button
                          type="button"
                          onClick={() => setPickerSearch('')}
                          className="px-3 py-2 rounded-md border border-rule text-xs text-mute hover:text-ink"
                        >
                          ล้างคำค้นหา
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomExName(pickerSearch.trim());
                          if (pickerCategory !== 'All') setCustomExCategory(pickerCategory);
                          if (pickerUnit === 'pin' || pickerUnit === 'kg') setCustomExUnit(pickerUnit);
                          setIsCreatingExerciseInPicker(true);
                        }}
                        className="px-3.5 py-2 rounded-md bg-plate-blue hover:bg-plate-blue-dark text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        สร้างท่า {pickerSearch.trim() ? `"${pickerSearch.trim()}"` : 'ใหม่'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-rule">
                    {filteredPickerExercises.map((ex) => {
                      const isAlreadyInRoutine = existingIds.includes(ex.id);

                      return (
                        <button
                          key={ex.id}
                          type="button"
                          disabled={isAlreadyInRoutine}
                          onClick={() => {
                            handleAddExerciseToRoutine(addingExerciseToRoutineId, ex.id);
                            setPickerSearch('');
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                            isAlreadyInRoutine
                              ? 'opacity-50 bg-well/30 cursor-not-allowed'
                              : 'hover:bg-well cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {ex.unit_type === 'pin' ? (
                              <Layers className="w-4 h-4 shrink-0 text-faint" />
                            ) : (
                              <Dumbbell className="w-4 h-4 shrink-0 text-faint" />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-ink text-sm truncate flex items-center gap-1.5">
                                <span>{ex.name}</span>
                                {isAlreadyInRoutine && (
                                  <span className="text-[11px] font-normal text-plate-green flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> ในตารางแล้ว
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-mute">
                                {CATEGORY_NAMES_TH[ex.category]}
                              </div>
                            </div>
                          </div>

                          <span className="text-xs text-mute shrink-0">
                            {ex.unit_type === 'pin' ? 'แผ่น' : 'kg'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Persistent Bottom Bar to create custom exercise anytime */}
                <div className="sticky bottom-0 bg-paper/95 backdrop-blur-sm px-4 py-3 border-t border-rule flex items-center justify-between">
                  <span className="text-xs text-mute">หาท่าที่ต้องการไม่พบ?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomExName(pickerSearch.trim());
                      if (pickerCategory !== 'All') setCustomExCategory(pickerCategory);
                      if (pickerUnit === 'pin' || pickerUnit === 'kg') setCustomExUnit(pickerUnit);
                      setIsCreatingExerciseInPicker(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-well hover:bg-rule/70 text-plate-blue font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + สร้างท่าใหม่
                  </button>
                </div>
              </>
            )}
          </Sheet>
        );
      })()}

      {/* Quick Swap Routine Days Modal */}
      {swappingTargetRoutine && (
        <Sheet
          title={`สลับวัน: ${swappingTargetRoutine.name}`}
          description={`ปัจจุบันคือวัน${swappingTargetRoutine.day} — เลือกตารางที่ต้องการสลับวันด้วย:`}
          onClose={() => setSwappingTargetRoutine(null)}
          size="md"
          stacked
        >
          <div className="p-4 space-y-2">
            {routines
              .filter((r) => r.id !== swappingTargetRoutine.id)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    handleSwapRoutines(swappingTargetRoutine.id, r.id);
                    setSwappingTargetRoutine(null);
                  }}
                  className="w-full p-3.5 rounded-lg border border-rule hover:border-plate-blue hover:bg-well/70 flex items-center justify-between transition-all text-left group shadow-2xs"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-plate-blue bg-plate-blue/10 px-2 py-0.5 rounded-full shrink-0">
                        วัน{r.day}
                      </span>
                      <span className="font-semibold text-ink text-sm group-hover:text-plate-blue transition-colors truncate">
                        {r.name}
                      </span>
                    </div>
                    <div className="text-xs text-mute mt-1 truncate">
                      {r.focus} • <span className="num">{r.exerciseIds.length}</span> ท่า
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-well group-hover:bg-plate-blue group-hover:text-white text-mute transition-colors shrink-0">
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </button>
              ))}
          </div>
        </Sheet>
      )}
    </>
  );
}
