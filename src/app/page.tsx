'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, MapPin, Timer, LogIn, User as UserIcon } from 'lucide-react';
import {
  Exercise,
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  GymLocation,
} from '@/types/workout';
import { RoutinePreset } from '@/lib/workoutRoutines';
import { DEFAULT_LOCATIONS } from '@/lib/defaultLocations';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getLocalActiveWorkout,
  setLocalActiveWorkout,
  getLocalWorkoutHistory,
  saveLocalWorkoutHistory,
  getLocalExercises,
  fetchExercisesFromSupabase,
  saveLocalCustomExercise,
  findLastPerformance,
  findExerciseMatch,
  syncWorkoutToSupabase,
  testSupabaseConnection,
  getLocalRoutines,
  saveLocalRoutines,
  resetLocalRoutines,
  fetchRoutinesFromSupabase,
  syncRoutinesToSupabase,
  fetchWorkoutHistoryFromSupabase,
  getLocalLocations,
  saveLocalLocations,
  getSelectedLocation,
  setSelectedLocation,
  getCurrentUser,
  signOutUser,
} from '@/lib/storage';
import ExerciseCard from '@/components/ExerciseCard';
import AddExerciseModal from '@/components/AddExerciseModal';
import RestTimer from '@/components/RestTimer';
import WorkoutSummaryModal from '@/components/WorkoutSummaryModal';
import HistoryModal from '@/components/HistoryModal';
import SqlModal from '@/components/SqlModal';
import RoutineManagerModal from '@/components/RoutineManagerModal';
import LocationPickerModal from '@/components/LocationPickerModal';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  // App State
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutinePreset[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [locations, setLocations] = useState<GymLocation[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<GymLocation>(
    DEFAULT_LOCATIONS[0]
  );

  // Modals
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isRoutineManagerOpen, setIsRoutineManagerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  // undefined = auto (first unfinished exercise), null = all collapsed
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null | undefined>(
    undefined
  );
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

  // Helper to load user-isolated data
  const loadUserData = async (user: { id: string; email?: string } | null) => {
    const uid = user?.id || null;

    // 1. Load routines for this specific user
    const localRoutines = getLocalRoutines(uid);
    setRoutines(localRoutines);

    if (uid) {
      const remoteRoutines = await fetchRoutinesFromSupabase(uid);
      if (remoteRoutines && remoteRoutines.length > 0) {
        setRoutines(remoteRoutines);
        saveLocalRoutines(remoteRoutines, uid);
      } else if (remoteRoutines && remoteRoutines.length === 0) {
        // First time user: save initial copy for their account
        saveLocalRoutines(localRoutines, uid);
        await syncRoutinesToSupabase(localRoutines, uid);
      }
    }

    // 2. Load workout history for this user
    const localHistory = getLocalWorkoutHistory(uid);
    setHistory(localHistory);

    if (uid) {
      const remoteHistory = await fetchWorkoutHistoryFromSupabase(uid);
      if (remoteHistory && remoteHistory.length > 0) {
        setHistory(remoteHistory);
        localStorage.setItem(
          `power_pace_workout_history_${uid}`,
          JSON.stringify(remoteHistory)
        );
      }
    }

    // 3. Load active workout for this user
    const active = getLocalActiveWorkout(uid);
    setActiveWorkout(active);
  };

  // Initialize data on mount
  useEffect(() => {
    // 1. 100% Online Exercises from Supabase
    const cachedExercises = getLocalExercises();
    setExercises(cachedExercises);
    fetchExercisesFromSupabase().then((remoteExercises) => {
      if (remoteExercises && remoteExercises.length > 0) {
        setExercises(remoteExercises);
      }
    });

    // 2. Gym locations
    const loadedLocations = getLocalLocations();
    setLocations(loadedLocations);
    const currentLoc = getSelectedLocation();
    setSelectedLocationState(currentLoc);

    // 3. Supabase connection check
    testSupabaseConnection().then((res) => setSupabaseStatus(res));

    // 4. Initial auth session check and data load
    getCurrentUser().then(async (u) => {
      const user = u ? { id: u.id, email: u.email } : null;
      setCurrentUser(user);
      await loadUserData(user);
    });

    // 5. Real-time auth state listener
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const user = { id: session.user.id, email: session.user.email };
            setCurrentUser(user);
            await loadUserData(user);
          } else {
            setCurrentUser(null);
            await loadUserData(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Sync active workout to local storage per user
  useEffect(() => {
    if (activeWorkout) {
      setLocalActiveWorkout(activeWorkout, currentUser?.id);
    }
  }, [activeWorkout, currentUser]);

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

  // Handle location selection
  const handleSelectLocation = (loc: GymLocation) => {
    setSelectedLocationState(loc);
    setSelectedLocation(loc);

    // If an active workout is in progress, update location AND auto-update uncompleted sets to match the new gym's records!
    if (activeWorkout) {
      setActiveWorkout((prev) => {
        if (!prev) return null;
        const updatedExercises = prev.exercises.map((ex) => {
          const lastPerf = findLastPerformance(
            ex.exercise_id,
            ex.exercise_name,
            loc.id,
            loc.name
          );

          const targetWeight = lastPerf
            ? lastPerf.weight_or_pin
            : ex.unit_type === 'pin'
            ? 4
            : 15;
          const targetReps = lastPerf ? lastPerf.reps : 10;

          // Auto-update uncompleted sets to the new gym's weight/pin
          const updatedSets = ex.sets.map((s) => {
            if (!s.is_completed) {
              return {
                ...s,
                weight_or_pin: targetWeight,
                reps: targetReps,
              };
            }
            return s;
          });

          return {
            ...ex,
            previous_performance: lastPerf || undefined,
            sets: updatedSets,
          };
        });

        return {
          ...prev,
          location_id: loc.id,
          location_name: loc.name,
          exercises: updatedExercises,
        };
      });
    }
  };

  // Handle add location
  const handleAddLocation = (newLoc: GymLocation) => {
    const updated = [...locations, newLoc];
    setLocations(updated);
    saveLocalLocations(updated);
  };

  // Handle delete location
  const handleDeleteLocation = (locId: string) => {
    const updated = locations.filter((l) => l.id !== locId);
    if (updated.length === 0) return;
    setLocations(updated);
    saveLocalLocations(updated);
    if (selectedLocation.id === locId && updated.length > 0) {
      handleSelectLocation(updated[0]);
    }
  };

  // Start new empty workout
  const handleStartWorkout = (title = 'คอร์สเวทเทรนนิ่ง') => {
    const today = new Date().toISOString().split('T')[0];
    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      title,
      date: today,
      duration_seconds: 0,
      location_id: selectedLocation.id,
      location_name: selectedLocation.name,
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
        const exercise = findExerciseMatch(loadedExercises, exId);
        if (!exercise) return null;
        const lastPerf = findLastPerformance(
          exercise.id,
          exercise.name,
          selectedLocation.id,
          selectedLocation.name,
          currentUser?.id
        );
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
      location_id: selectedLocation.id,
      location_name: selectedLocation.name,
      exercises: initialExercises,
      is_completed: false,
    };

    setExpandedExerciseId(undefined);
    setActiveWorkout(newSession);
    setLocalActiveWorkout(newSession, currentUser?.id);
  };

  // Save / Update Routines (per user)
  const handleSaveRoutines = (updated: RoutinePreset[]) => {
    setRoutines(updated);
    saveLocalRoutines(updated, currentUser?.id);
    if (currentUser?.id) {
      syncRoutinesToSupabase(updated, currentUser.id);
    }
  };

  // Reset Routines to Default (per user)
  const handleResetRoutines = () => {
    const def = resetLocalRoutines(currentUser?.id);
    setRoutines(def);
    if (currentUser?.id) {
      syncRoutinesToSupabase(def, currentUser.id);
    }
  };

  // Add exercise to active workout
  const handleSelectExercise = (exercise: Exercise) => {
    if (!activeWorkout) {
      handleStartWorkout();
    }

    const lastPerf = findLastPerformance(
      exercise.id,
      exercise.name,
      selectedLocation.id,
      selectedLocation.name
    );

    const initialWeight = lastPerf
      ? lastPerf.weight_or_pin
      : exercise.unit_type === 'pin'
      ? 4
      : 15;
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

    setExpandedExerciseId(newWorkoutExercise.id);
    setActiveWorkout((prev) => {
      if (!prev) {
        return {
          id: `workout-${Date.now()}`,
          title: 'คอร์สเวทเทรนนิ่ง',
          date: new Date().toISOString().split('T')[0],
          duration_seconds: 0,
          location_id: selectedLocation.id,
          location_name: selectedLocation.name,
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
    const target = activeWorkout.exercises
      .find((ex) => ex.id === workoutExerciseId)
      ?.sets.find((s) => s.id === setId);
    const shouldStartTimer = Boolean(target && !target.is_completed);

    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, is_completed: !s.is_completed };
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
      location_id: selectedLocation.id,
      location_name: selectedLocation.name,
    };

    // Save to local storage history
    saveLocalWorkoutHistory(completedWorkout, currentUser?.id);
    setHistory((prev) => [completedWorkout, ...prev.filter((w) => w.id !== completedWorkout.id)]);

    // Clear active workout
    setLocalActiveWorkout(null, currentUser?.id);
    setActiveWorkout(null);

    // Sync to Supabase
    const syncRes = await syncWorkoutToSupabase(completedWorkout);
    setLastSyncSuccess(syncRes.success);

    // Open celebration summary modal
    setFinishedWorkout(completedWorkout);
  };

  // Discard current workout
  const handleDiscardWorkout = () => {
    if (confirm('ต้องการยกเลิกและรีเซ็ตการฝึกซ้อมรอบนี้ใช่หรือไม่?')) {
      setActiveWorkout(null);
      setLocalActiveWorkout(null, currentUser?.id);
    }
  };

  // Format workout time
  const formatWorkoutDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const completedSets = activeWorkout
    ? activeWorkout.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((s) => s.is_completed).length,
        0
      )
    : 0;

  const autoExpandedId =
    activeWorkout?.exercises.find(
      (ex) => ex.sets.length === 0 || ex.sets.some((s) => !s.is_completed)
    )?.id ?? null;
  const openExerciseId =
    expandedExerciseId === undefined ? autoExpandedId : expandedExerciseId;

  // Helper to check if routine matches current day of the week
  const isTodayRoutine = (routine: RoutinePreset) => {
    const todayIndex = new Date().getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const dayKeywords: Record<number, string[]> = {
      0: ['อาทิตย์', 'sunday', 'sun'],
      1: ['จันทร์', 'monday', 'mon'],
      2: ['อังคาร', 'tuesday', 'tue'],
      3: ['พุธ', 'wednesday', 'wed'],
      4: ['พฤหัส', 'พฤหัสบดี', 'thursday', 'thu'],
      5: ['ศุกร์', 'friday', 'fri'],
      6: ['เสาร์', 'saturday', 'sat'],
    };

    const targets = dayKeywords[todayIndex] || [];
    const text = `${routine.day} ${routine.name} ${routine.id}`.toLowerCase();
    return targets.some((k) => text.includes(k));
  };

  // Sort routines so today's routine always appears at the very top!
  const sortedRoutines = [...routines].sort((a, b) => {
    const aIsToday = isTodayRoutine(a);
    const bIsToday = isTodayRoutine(b);
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return 0;
  });

  return (
    <main className="min-h-screen bg-concrete text-ink pb-32">
      {/* App bar */}
      <header className="sticky top-0 z-40 bg-concrete/95 backdrop-blur-sm border-b border-rule">
        <div className="max-w-xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">PowerPace</h1>
          </div>

          <nav className="flex items-center -mr-2 gap-0.5">
            <button
              type="button"
              onClick={() => setIsRoutineManagerOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-sm font-medium text-ink hover:bg-ink/5"
            >
              ตาราง
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-sm font-medium text-ink hover:bg-ink/5"
            >
              ประวัติ
            </button>

            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`คุณต้องการออกจากระบบ (${currentUser.email}) หรือไม่?`)) {
                    signOutUser().then(() => setCurrentUser(null));
                  }
                }}
                className="ml-1 px-2 py-1.5 rounded-md text-xs font-semibold bg-well hover:bg-rule/70 text-ink flex items-center gap-1.5 max-w-[125px] truncate transition-colors"
                title={`ล็อกอินด้วย: ${currentUser.email} (แตะเพื่อออกจากระบบ)`}
              >
                <UserIcon className="w-3.5 h-3.5 text-plate-blue shrink-0" />
                <span className="truncate">{currentUser.email?.split('@')[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-plate-blue hover:bg-plate-blue-dark text-white flex items-center gap-1 transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Location */}
        <button
          type="button"
          onClick={() => setIsLocationPickerOpen(true)}
          className="flex items-center gap-1.5 text-sm text-mute hover:text-ink -ml-0.5"
        >
          <MapPin className="w-4 h-4" />
          <span>เล่นที่</span>
          <span className="font-semibold text-ink truncate max-w-[220px]">
            {selectedLocation.name}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {activeWorkout ? (
          /* Active session summary */
          <div className="pb-1">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold leading-tight min-w-0">
                {activeWorkout.title}
              </h2>
              <div
                className="num text-5xl font-bold leading-none text-ink"
                aria-label="เวลาที่เล่นไป"
              >
                {formatWorkoutDuration(activeWorkout.duration_seconds)}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-mute">
              <span>
                <span className="num text-lg font-semibold text-ink">
                  {activeWorkout.exercises.length}
                </span>{' '}
                ท่า
              </span>
              <span>
                <span className="num text-lg font-semibold text-ink">{completedSets}</span>{' '}
                เซ็ตที่เล่นแล้ว
              </span>
              <button
                type="button"
                onClick={() => setIsRestTimerActive(true)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rule text-ink font-medium hover:bg-paper"
              >
                <Timer className="w-4 h-4" />
                พัก 90 วิ
              </button>
            </div>
          </div>
        ) : (
          /* Weekly routine list */
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-2xl font-bold">วันนี้เล่นอะไร</h2>
              <button
                type="button"
                onClick={() => setIsRoutineManagerOpen(true)}
                className="text-sm font-medium text-plate-blue hover:underline underline-offset-2"
              >
                แก้ไขตาราง
              </button>
            </div>

            <ul className="bg-paper rounded-lg border border-rule divide-y divide-rule overflow-hidden">
              {sortedRoutines.map((routine) => {
                const isToday = isTodayRoutine(routine);

                return (
                  <li
                    key={routine.id}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                      isToday ? 'bg-well/50 ring-1 ring-inset ring-plate-blue/20' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink text-base">{routine.name}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-plate-blue text-white tracking-wide shadow-xs">
                            วันนี้
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-mute truncate mt-0.5">
                        {routine.focus}
                        <span className="text-faint">
                          {', '}
                          <span className="num">{routine.exerciseIds.length}</span> ท่า
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartRoutine(routine)}
                      className={`shrink-0 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                        isToday
                          ? 'bg-plate-blue hover:bg-plate-blue-dark text-white shadow-sm'
                          : 'bg-well hover:bg-rule/70 text-ink'
                      }`}
                    >
                      เริ่ม
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => handleStartWorkout('เลือกท่าเอง')}
              className="mt-3 w-full py-3 rounded-md border border-dashed border-faint text-sm font-medium text-mute hover:text-ink hover:border-ink transition-colors"
            >
              เริ่มแบบเลือกท่าเอง
            </button>
          </div>
        )}

        {/* Exercises in the active workout */}
        {activeWorkout && (
          <div className="space-y-3">
            {activeWorkout.exercises.length === 0 ? (
              <div className="py-10 px-6 text-center rounded-lg border border-dashed border-faint">
                <p className="font-semibold text-ink">ยังไม่มีท่าในรอบนี้</p>
                <p className="mt-1 text-sm text-mute">
                  เลือกท่าจากรายการ Machine หรือ Free Weight
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="mt-4 px-4 py-2.5 rounded-md bg-plate-blue hover:bg-plate-blue-dark text-white text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มท่าแรก
                </button>
              </div>
            ) : (
              activeWorkout.exercises.map((ex) => {
                const currentGymPerf = findLastPerformance(
                  ex.exercise_id,
                  ex.exercise_name,
                  selectedLocation.id,
                  selectedLocation.name
                );

                return (
                  <ExerciseCard
                    key={ex.id}
                    exercise={{
                      ...ex,
                      previous_performance: currentGymPerf || undefined,
                    }}
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
                    isExpanded={openExerciseId === ex.id}
                    onToggleExpand={() =>
                      setExpandedExerciseId(openExerciseId === ex.id ? null : ex.id)
                    }
                    onApplyPreviousPerformance={() => {
                      if (!currentGymPerf) return;
                      const updatedSets = ex.sets.map((s) => {
                        if (!s.is_completed) {
                          return {
                            ...s,
                            weight_or_pin: currentGymPerf.weight_or_pin,
                            reps: currentGymPerf.reps,
                          };
                        }
                        return s;
                      });
                      handleUpdateExercise(ex.id, { sets: updatedSets });
                    }}
                  />
                );
              })
            )}

            {activeWorkout.exercises.length > 0 && (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="w-full py-3 rounded-md border border-dashed border-faint text-sm font-medium text-mute hover:text-ink hover:border-ink flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มท่า
                </button>

                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  className="w-full py-4 rounded-md bg-plate-blue hover:bg-plate-blue-dark text-white text-base font-semibold transition-colors"
                >
                  จบและบันทึก
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleDiscardWorkout}
                className="text-sm text-mute hover:text-plate-red underline-offset-2 hover:underline"
              >
                ยกเลิกรอบนี้
              </button>
            </div>
          </div>
        )}
      </div>

      <RestTimer
        isActive={isRestTimerActive}
        initialSeconds={restTimerSeconds}
        onClose={() => setIsRestTimerActive(false)}
      />

      {/* Modals */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        locations={locations}
        selectedLocation={selectedLocation}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelectLocation={handleSelectLocation}
        onAddLocation={handleAddLocation}
        onDeleteLocation={handleDeleteLocation}
      />

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
        onCreateCustomExercise={async (newEx) => {
          await saveLocalCustomExercise(newEx);
          const online = await fetchExercisesFromSupabase();
          if (online && online.length > 0) {
            setExercises(online);
          } else {
            setExercises((prev) => [...prev, newEx]);
          }
        }}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onDeleteSession={(id) => {
          const updated = history.filter((h) => h.id !== id);
          setHistory(updated);
          const key = `power_pace_workout_history_${currentUser?.id || 'guest'}`;
          localStorage.setItem(key, JSON.stringify(updated));
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(userEmail) => {
          console.log('Successfully logged in as:', userEmail);
        }}
      />
    </main>
  );
}
