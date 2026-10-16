'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Plus,
  History,
  Timer,
  Layers,
  Sparkles,
  Database,
  Calendar,
  RotateCcw,
  Activity,
  Flame,
  Settings,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { Exercise, WorkoutSession, WorkoutExercise, ExerciseSet } from '@/types/workout';
import { RoutinePreset } from '@/lib/workoutRoutines';
import {
  getLocalActiveWorkout,
  setLocalActiveWorkout,
  getLocalWorkoutHistory,
  saveLocalWorkoutHistory,
  getLocalExercises,
  saveLocalCustomExercise,
  findLastPerformance,
  syncWorkoutToSupabase,
  testSupabaseConnection,
  getLocalRoutines,
  saveLocalRoutines,
  resetLocalRoutines,
} from '@/lib/storage';
import ExerciseCard from '@/components/ExerciseCard';
import AddExerciseModal from '@/components/AddExerciseModal';
import RestTimer from '@/components/RestTimer';
import WorkoutSummaryModal from '@/components/WorkoutSummaryModal';
import HistoryModal from '@/components/HistoryModal';
import SqlModal from '@/components/SqlModal';
import RoutineManagerModal from '@/components/RoutineManagerModal';

export default function Home() {
  // App State
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutinePreset[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);

  // Modals
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isRoutineManagerOpen, setIsRoutineManagerOpen] = useState(false);
  const [finishedWorkout, setFinishedWorkout] = useState<WorkoutSession | null>(null);
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);

  // Rest Timer State
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);

  // Supabase status
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    message: string;
  }>({ connected: false, message: 'กำลังตรวจสอบการเชื่อมต่อ...' });

  // Workout duration timer
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedExercises = getLocalExercises();
    setExercises(loadedExercises);

    const loadedRoutines = getLocalRoutines();
    setRoutines(loadedRoutines);

    const loadedHistory = getLocalWorkoutHistory();
    setHistory(loadedHistory);

    const active = getLocalActiveWorkout();
    if (active) {
      setActiveWorkout(active);
    }

    // Check Supabase connection
    testSupabaseConnection().then((res) => setSupabaseStatus(res));
  }, []);

  // Sync active workout to local storage
  useEffect(() => {
    if (activeWorkout) {
      setLocalActiveWorkout(activeWorkout);
    }
  }, [activeWorkout]);

  // Workout duration ticker
  useEffect(() => {
    if (activeWorkout && !activeWorkout.is_completed) {
      workoutTimerRef.current = setInterval(() => {
        setActiveWorkout((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            duration_seconds: prev.duration_seconds + 1,
          };
        });
      }, 1000);
    } else {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    }

    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [Boolean(activeWorkout)]);

  // Start new empty workout
  const handleStartWorkout = (title = 'คอร์สเวทเทรนนิ่ง') => {
    const today = new Date().toISOString().split('T')[0];
    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      title,
      date: today,
      duration_seconds: 0,
      exercises: [],
      is_completed: false,
    };
    setActiveWorkout(newSession);
    setLocalActiveWorkout(newSession);
  };

  // Start workout from a preset routine day
  const handleStartRoutine = (routine: RoutinePreset) => {
    const today = new Date().toISOString().split('T')[0];
    const loadedExercises = exercises.length > 0 ? exercises : getLocalExercises();

    const initialExercises: WorkoutExercise[] = routine.exerciseIds
      .map((exId, idx) => {
        const exercise = loadedExercises.find((e) => e.id === exId);
        if (!exercise) return null;
        const lastPerf = findLastPerformance(exercise.id, exercise.name);
        const initialWeight = lastPerf
          ? lastPerf.weight_or_pin
          : exercise.unit_type === 'pin'
          ? 4
          : 15;
        const initialReps = lastPerf ? lastPerf.reps : 10;

        return {
          id: `we-${Date.now()}-${idx}`,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          category: exercise.category,
          unit_type: exercise.unit_type,
          previous_performance: lastPerf || undefined,
          sets: [
            {
              id: `set-${Date.now()}-${idx}-1`,
              set_number: 1,
              weight_or_pin: initialWeight,
              reps: initialReps,
              is_completed: false,
            },
          ],
        };
      })
      .filter(Boolean) as WorkoutExercise[];

    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      title: routine.name,
      date: today,
      duration_seconds: 0,
      exercises: initialExercises,
      is_completed: false,
    };

    setActiveWorkout(newSession);
    setLocalActiveWorkout(newSession);
  };

  // Save / Update Routines
  const handleSaveRoutines = (updated: RoutinePreset[]) => {
    setRoutines(updated);
    saveLocalRoutines(updated);
  };

  // Reset Routines to Default
  const handleResetRoutines = () => {
    const def = resetLocalRoutines();
    setRoutines(def);
  };

  // Add exercise to active workout
  const handleSelectExercise = (exercise: Exercise) => {
    if (!activeWorkout) {
      handleStartWorkout();
    }

    const lastPerf = findLastPerformance(exercise.id, exercise.name);

    const initialWeight = lastPerf ? lastPerf.weight_or_pin : exercise.unit_type === 'pin' ? 4 : 15;
    const initialReps = lastPerf ? lastPerf.reps : 10;

    const newWorkoutExercise: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      category: exercise.category,
      unit_type: exercise.unit_type,
      previous_performance: lastPerf || undefined,
      sets: [
        {
          id: `set-${Date.now()}-1`,
          set_number: 1,
          weight_or_pin: initialWeight,
          reps: initialReps,
          is_completed: false,
        },
      ],
    };

    setActiveWorkout((prev) => {
      if (!prev) {
        return {
          id: `workout-${Date.now()}`,
          title: 'คอร์สเวทเทรนนิ่ง',
          date: new Date().toISOString().split('T')[0],
          duration_seconds: 0,
          exercises: [newWorkoutExercise],
          is_completed: false,
        };
      }
      return {
        ...prev,
        exercises: [...prev.exercises, newWorkoutExercise],
      };
    });
  };

  // Add set to an exercise (Smart auto-fill from previous set)
  const handleAddSet = (workoutExerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;

        const lastSet = ex.sets[ex.sets.length - 1];
        const nextWeight = lastSet ? lastSet.weight_or_pin : ex.unit_type === 'pin' ? 4 : 15;
        const nextReps = lastSet ? lastSet.reps : 10;

        const newSet: ExerciseSet = {
          id: `set-${Date.now()}-${ex.sets.length + 1}`,
          set_number: ex.sets.length + 1,
          weight_or_pin: nextWeight,
          reps: nextReps,
          is_completed: false,
        };

        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      });

      return { ...prev, exercises: updatedExercises };
    });
  };

  // Progressive Set Overload Helper (Increases weight, drops 2 reps)
  const handleApplyProgressiveSet = (workoutExerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;

        const lastSet = ex.sets[ex.sets.length - 1];
        const step = ex.unit_type === 'pin' ? 1 : 2.5;
        const nextWeight = lastSet ? Math.round((lastSet.weight_or_pin + step) * 10) / 10 : step * 4;
        const nextReps = lastSet ? Math.max(6, lastSet.reps - 2) : 8;

        const newSet: ExerciseSet = {
          id: `set-${Date.now()}-${ex.sets.length + 1}`,
          set_number: ex.sets.length + 1,
          weight_or_pin: nextWeight,
          reps: nextReps,
          is_completed: false,
        };

        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      });

      return { ...prev, exercises: updatedExercises };
    });
  };

  // Update a set
  const handleUpdateSet = (
    workoutExerciseId: string,
    setId: string,
    updates: Partial<ExerciseSet>
  ) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        const updatedSets = ex.sets.map((s) =>
          s.id === setId ? { ...s, ...updates } : s
        );
        return { ...ex, sets: updatedSets };
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Toggle set completion and activate rest timer
  const handleToggleCompleteSet = (
    workoutExerciseId: string,
    setId: string
  ) => {
    if (!activeWorkout) return;
    let shouldStartTimer = false;

    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            const nextStatus = !s.is_completed;
            if (nextStatus) shouldStartTimer = true;
            return { ...s, is_completed: nextStatus };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      });
      return { ...prev, exercises: updatedExercises };
    });

    if (shouldStartTimer) {
      setIsRestTimerActive(true);
      setRestTimerSeconds(90);
    }
  };

  // Delete set
  const handleDeleteSet = (workoutExerciseId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        const filteredSets = ex.sets
          .filter((s) => s.id !== setId)
          .map((s, idx) => ({ ...s, set_number: idx + 1 }));
        return { ...ex, sets: filteredSets };
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Remove exercise from workout
  const handleRemoveExercise = (workoutExerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter((ex) => ex.id !== workoutExerciseId),
      };
    });
  };

  // Update exercise properties (e.g. Unit type switch)
  const handleUpdateExercise = (
    workoutExerciseId: string,
    updates: Partial<WorkoutExercise>
  ) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.id === workoutExerciseId ? { ...ex, ...updates } : ex
        ),
      };
    });
  };

  // Finish Workout
  const handleFinishWorkout = async () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return;

    const completedWorkout: WorkoutSession = {
      ...activeWorkout,
      is_completed: true,
    };

    // Save to local storage history
    saveLocalWorkoutHistory(completedWorkout);
    setHistory((prev) => [completedWorkout, ...prev.filter((w) => w.id !== completedWorkout.id)]);

    // Clear active workout
    setLocalActiveWorkout(null);
    setActiveWorkout(null);

    // Sync to Supabase
    const syncRes = await syncWorkoutToSupabase(completedWorkout);
    setLastSyncSuccess(syncRes.success);

    // Open celebration summary modal
    setFinishedWorkout(completedWorkout);
  };

  // Format workout time
  const formatWorkoutDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="min-h-screen bg-[#090c10] text-[#f0f3f6] pb-28">
      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-40 bg-[#090c10]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-black font-black shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                PowerPace
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Gym Tracker
                </span>
              </h1>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="text-[11px] text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition text-left"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    supabaseStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span className="truncate max-w-[170px] sm:max-w-none">
                  {supabaseStatus.connected ? 'Supabase Sync พร้อม' : 'Cloud Setup (SQL)'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsRoutineManagerOpen(true)}
              className="p-2.5 rounded-xl bg-[#121721] hover:bg-[#1a2130] border border-white/5 text-gray-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
              title="จัดการตารางเล่น"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ตารางเล่น</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="p-2.5 rounded-xl bg-[#121721] hover:bg-[#1a2130] border border-white/5 text-gray-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
              title="ประวัติการเล่น"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ประวัติ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Active Session Status Card */}
        {activeWorkout ? (
          <div className="bg-[#121721] rounded-2xl p-4 border border-emerald-500/30 shadow-xl glow-lime">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    กำลังฝึกซ้อมอยู่ (Workout in Progress)
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {activeWorkout.title}
                </h2>
              </div>

              {/* Timer & Finish button */}
              <div className="text-right">
                <div className="text-xs text-gray-400 font-medium">เวลาที่ผ่านไป</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {formatWorkoutDuration(activeWorkout.duration_seconds)}
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
              <div>
                <div className="text-[11px] text-gray-400">จำนวนท่า</div>
                <div className="text-sm font-bold text-white">
                  {activeWorkout.exercises.length} ท่า
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-400">เซ็ตที่สำเร็จ</div>
                <div className="text-sm font-bold text-emerald-400">
                  {activeWorkout.exercises.reduce(
                    (acc, ex) => acc + ex.sets.filter((s) => s.is_completed).length,
                    0
                  )}{' '}
                  เซ็ต
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-400">พักระหว่างเซ็ต</div>
                <button
                  type="button"
                  onClick={() => setIsRestTimerActive(true)}
                  className="text-xs font-bold text-orange-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Timer className="w-3.5 h-3.5" /> พัก 90s
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Start Workout Hero */
          <div className="bg-[#121721] rounded-3xl p-5 border border-white/5 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h2 className="text-base font-black text-white">
                  ตารางฝึกซ้อมประจำสัปดาห์
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRoutineManagerOpen(true)}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                แก้ไขตาราง
              </button>
            </div>

            {/* Preset Routine Cards List */}
            <div className="space-y-2 text-left">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-3 rounded-2xl bg-[#161d2a] hover:bg-[#1b2536] border border-white/5 transition flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">
                        {routine.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                        {routine.exerciseIds.length} ท่า
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {routine.focus}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartRoutine(routine)}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    เริ่มเล่น
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Empty Workout button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleStartWorkout('คอร์สอิสระ (Custom Workout)')}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs tracking-wide transition border border-white/5 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                สร้างเซสชันเปล่า (เลือกท่าเอง)
              </button>
            </div>
          </div>
        )}

        {/* Exercises List in Active Workout */}
        {activeWorkout && (
          <div className="space-y-4">
            {activeWorkout.exercises.length === 0 ? (
              <div className="text-center py-10 bg-[#121721]/50 rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
                <Dumbbell className="w-10 h-10 mx-auto text-gray-600" />
                <div className="text-sm font-bold text-gray-300">
                  ยังไม่ได้เพิ่มท่าออกกำลังกาย
                </div>
                <p className="text-xs text-gray-500">
                  กดปุ่ม "เพิ่มท่าออกกำลังกาย" เพื่อเลือกท่า Machine หรือ Free Weight
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs inline-flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  + เพิ่มท่าแรก
                </button>
              </div>
            ) : (
              activeWorkout.exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onUpdateExercise={(updates) => handleUpdateExercise(ex.id, updates)}
                  onRemoveExercise={() => handleRemoveExercise(ex.id)}
                  onAddSet={() => handleAddSet(ex.id)}
                  onUpdateSet={(setId, updates) =>
                    handleUpdateSet(ex.id, setId, updates)
                  }
                  onToggleCompleteSet={(setId) =>
                    handleToggleCompleteSet(ex.id, setId)
                  }
                  onDeleteSet={(setId) => handleDeleteSet(ex.id, setId)}
                  onApplyProgressiveSet={() => handleApplyProgressiveSet(ex.id)}
                />
              ))
            )}

            {/* Bottom buttons inside active workout */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAddExerciseOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-[#161d2a] hover:bg-[#1c2637] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition shadow"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                + เพิ่มท่าออกกำลังกาย (Add Exercise)
              </button>

              {activeWorkout.exercises.length > 0 && (
                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  บันทึกและจบการฝึกซ้อม (Finish Workout)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Rest Timer Component */}
      <RestTimer
        isActive={isRestTimerActive}
        initialSeconds={restTimerSeconds}
        onClose={() => setIsRestTimerActive(false)}
      />

      {/* Modals */}
      <RoutineManagerModal
        isOpen={isRoutineManagerOpen}
        routines={routines}
        allExercises={exercises}
        onClose={() => setIsRoutineManagerOpen(false)}
        onSaveRoutines={handleSaveRoutines}
        onStartRoutine={handleStartRoutine}
        onResetToDefault={handleResetRoutines}
      />

      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        exercises={exercises}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelectExercise={handleSelectExercise}
        onCreateCustomExercise={(newEx) => {
          saveLocalCustomExercise(newEx);
          setExercises((prev) => [...prev, newEx]);
        }}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onDeleteSession={(id) => {
          const updated = history.filter((h) => h.id !== id);
          setHistory(updated);
          localStorage.setItem('power_pace_workout_history', JSON.stringify(updated));
        }}
      />

      {finishedWorkout && (
        <WorkoutSummaryModal
          workout={finishedWorkout}
          supabaseSynced={lastSyncSuccess}
          onClose={() => setFinishedWorkout(null)}
        />
      )}

      <SqlModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </main>
  );
}
