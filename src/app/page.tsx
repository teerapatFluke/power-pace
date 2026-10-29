'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  ChevronDown,
  MapPin,
  LogIn,
  User as UserIcon,
  GripVertical,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import {
  Exercise,
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  GymLocation,
} from '@/types/workout';
import { RoutinePreset, swapRoutineDays } from '@/lib/workoutRoutines';
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
import WorkoutSummaryModal from '@/components/WorkoutSummaryModal';
import HistoryModal from '@/components/HistoryModal';
import SqlModal from '@/components/SqlModal';
import RoutineManagerModal from '@/components/RoutineManagerModal';
import LocationPickerModal from '@/components/LocationPickerModal';
import AuthModal from '@/components/AuthModal';
import Sheet from '@/components/Sheet';

export default function Home() {
  // App State
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutinePreset[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [todayDayIndex, setTodayDayIndex] = useState<number | null>(null);

  // Home Screen Routine Swap & Drag States
  const [homeDraggingRoutineId, setHomeDraggingRoutineId] = useState<string | null>(null);
  const [homeDragOverRoutineId, setHomeDragOverRoutineId] = useState<string | null>(null);
  const [homeSwappingRoutine, setHomeSwappingRoutine] = useState<RoutinePreset | null>(null);
  const [homeSwapToast, setHomeSwapToast] = useState<string | null>(null);
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
    if (active && !active.is_completed) {
      const now = Date.now();
      const startTime =
        active.started_at || now - (active.duration_seconds || 0) * 1000;
      const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
      setActiveWorkout({
        ...active,
        started_at: startTime,
        duration_seconds: elapsed,
      });
    } else {
      setActiveWorkout(active);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    setTodayDayIndex(new Date().getDay());

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

  // Workout duration ticker based on wall-clock time
  useEffect(() => {
    if (!activeWorkout || activeWorkout.is_completed) {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      return;
    }

    const now = Date.now();
    const startTime =
      activeWorkout.started_at || now - (activeWorkout.duration_seconds || 0) * 1000;

    const updateDuration = () => {
      const currentNow = Date.now();
      const elapsed = Math.max(0, Math.floor((currentNow - startTime) / 1000));
      setActiveWorkout((prev) => {
        if (!prev || prev.is_completed) return prev;
        if (prev.duration_seconds === elapsed && prev.started_at === startTime) {
          return prev;
        }
        return {
          ...prev,
          started_at: startTime,
          duration_seconds: elapsed,
        };
      });
    };

    updateDuration();
    workoutTimerRef.current = setInterval(updateDuration, 1000);

    // Sync immediately when screen unlocks, tab becomes visible, or phone wakes up!
    const handleSync = () => {
      updateDuration();
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('pageshow', handleSync);
    window.addEventListener('focus', handleSync);

    // Keep screen awake while actively viewing workout (if supported by browser)
    let wakeLockSentinel: any = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Ignore if user or system denies
        }
      };
      requestWakeLock();
    }

    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('pageshow', handleSync);
      window.removeEventListener('focus', handleSync);
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [activeWorkout?.id, activeWorkout?.is_completed, activeWorkout?.started_at]);

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
    const now = Date.now();
    const newSession: WorkoutSession = {
      id: `workout-${now}`,
      title,
      date: today,
      duration_seconds: 0,
      started_at: now,
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

    const now = Date.now();
    const newSession: WorkoutSession = {
      id: `workout-${now}`,
      title: routine.name,
      date: today,
      duration_seconds: 0,
      started_at: now,
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

  const handleCreateCustomExercise = async (newEx: Exercise): Promise<Exercise> => {
    const saved = await saveLocalCustomExercise(newEx);
    const online = await fetchExercisesFromSupabase();
    if (online && online.length > 0) {
      setExercises(online);
      const matched = online.find(
        (e) => e.name.toLowerCase() === newEx.name.toLowerCase()
      );
      return matched || saved || newEx;
    } else {
      setExercises((prev) => {
        const exists = prev.some(
          (e) => e.name.toLowerCase() === newEx.name.toLowerCase()
        );
        return exists ? prev : [...prev, saved || newEx];
      });
      return saved || newEx;
    }
  };

  // Swap Routine Days on Home Screen
  const handleHomeSwapRoutines = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const routineA = routines.find((r) => r.id === sourceId);
    const routineB = routines.find((r) => r.id === targetId);
    const updated = swapRoutineDays(routines, sourceId, targetId);
    setRoutines(updated);
    saveLocalRoutines(updated, currentUser?.id);
    if (currentUser?.id) {
      syncRoutinesToSupabase(updated, currentUser.id);
    }
    if (routineA && routineB) {
      setHomeSwapToast(`สลับวันสำเร็จ: ${routineA.day} ⇄ ${routineB.day}`);
      setTimeout(() => setHomeSwapToast(null), 3500);
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
      const now = Date.now();
      if (!prev) {
        return {
          id: `workout-${now}`,
          title: 'คอร์สเวทเทรนนิ่ง',
          date: new Date().toISOString().split('T')[0],
          duration_seconds: 0,
          started_at: now,
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

  // Toggle set completion
  const handleToggleCompleteSet = (
    workoutExerciseId: string,
    setId: string
  ) => {
    if (!activeWorkout) return;

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

    const now = Date.now();
    const finalDuration = activeWorkout.started_at
      ? Math.max(0, Math.floor((now - activeWorkout.started_at) / 1000))
      : activeWorkout.duration_seconds;

    const completedWorkout: WorkoutSession = {
      ...activeWorkout,
      duration_seconds: finalDuration,
      is_completed: true,
      location_id: selectedLocation.id,
      location_name: selectedLocation.name,
      created_at: new Date().toISOString(),
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

  // Identify strictly ONE routine that matches today's day of week (no duplicates)
  const todayRoutineMatch = useMemo(() => {
    if (todayDayIndex === null) return null;
    const dayTargets: Record<number, string[]> = {
      0: ['อาทิตย์', 'sunday', 'sun'],
      1: ['จันทร์', 'monday', 'mon'],
      2: ['อังคาร', 'tuesday', 'tue'],
      3: ['พุธ', 'wednesday', 'wed'],
      4: ['พฤหัส', 'พฤหัสบดี', 'thursday', 'thu'],
      5: ['ศุกร์', 'friday', 'fri'],
      6: ['เสาร์', 'saturday', 'sat'],
    };
    const todayTargets = dayTargets[todayDayIndex] || [];

    // Match strictly against routine.day (never routine.id!)
    // Pick at most ONE routine for today
    return (
      routines.find((r) => {
        const cleanDay = (r.day || '').trim().toLowerCase().replace(/^วัน/, '');
        return todayTargets.some((t) => cleanDay === t || cleanDay.startsWith(t));
      }) ||
      routines.find((r) => {
        const cleanName = (r.name || '').trim().toLowerCase().replace(/^วัน/, '');
        return todayTargets.some((t) => cleanName.startsWith(t));
      }) ||
      null
    );
  }, [routines, todayDayIndex]);

  const todayRoutineId = todayRoutineMatch ? todayRoutineMatch.id : null;

  const isTodayRoutine = (routine: RoutinePreset) => {
    return todayRoutineId !== null && routine.id === todayRoutineId;
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
              onClick={() => setIsAddExerciseOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-sm font-medium text-ink hover:bg-ink/5"
            >
              ท่าฝึก
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
            </div>
          </div>
        ) : (
          /* Weekly routine list */
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">วันนี้เล่นอะไร</h2>
                <span className="text-[11px] text-faint bg-well px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-plate-blue" />
                  ลากสลับวันได้
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRoutineManagerOpen(true)}
                className="text-sm font-medium text-plate-blue hover:underline underline-offset-2"
              >
                แก้ไขตาราง
              </button>
            </div>

            {/* Swap Toast Banner */}
            {homeSwapToast && (
              <div className="mb-2 px-3 py-2 bg-plate-green/10 border border-plate-green/30 text-plate-green text-xs font-semibold rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Check className="w-4 h-4 shrink-0" />
                <span>{homeSwapToast}</span>
              </div>
            )}

            <ul className="bg-paper rounded-lg border border-rule divide-y divide-rule overflow-hidden shadow-xs">
              {sortedRoutines.map((routine) => {
                const isToday = isTodayRoutine(routine);
                const isDragging = homeDraggingRoutineId === routine.id;
                const isDragOver = homeDragOverRoutineId === routine.id;

                return (
                  <li
                    key={routine.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', routine.id);
                      setHomeDraggingRoutineId(routine.id);
                    }}
                    onDragEnd={() => {
                      setHomeDraggingRoutineId(null);
                      setHomeDragOverRoutineId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (homeDraggingRoutineId && homeDraggingRoutineId !== routine.id) {
                        setHomeDragOverRoutineId(routine.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (homeDragOverRoutineId === routine.id) {
                        setHomeDragOverRoutineId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const srcId = e.dataTransfer.getData('text/plain') || homeDraggingRoutineId;
                      if (srcId && srcId !== routine.id) {
                        handleHomeSwapRoutines(srcId, routine.id);
                      }
                      setHomeDraggingRoutineId(null);
                      setHomeDragOverRoutineId(null);
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-3.5 transition-all select-none ${
                      isDragging
                        ? 'opacity-30 border-2 border-dashed border-plate-blue'
                        : isDragOver
                        ? 'bg-plate-blue/10 ring-2 ring-plate-blue shadow-md'
                        : isToday
                        ? 'bg-well/50 ring-1 ring-inset ring-plate-blue/20'
                        : 'hover:bg-well/30'
                    }`}
                  >
                    {/* Drag Handle */}
                    <div
                      className="p-1 -ml-1 text-faint hover:text-ink cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                      title="คลิกค้างแล้วลากเพื่อสลับวัน"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

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

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Quick Swap Days Button */}
                      <button
                        type="button"
                        onClick={() => setHomeSwappingRoutine(routine)}
                        className="p-2 rounded-md text-mute hover:text-plate-blue hover:bg-well transition-colors"
                        title="สลับวันกับตารางอื่น"
                        aria-label="สลับวันกับตารางอื่น"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartRoutine(routine)}
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all shadow-xs ${
                          isToday
                            ? 'bg-plate-blue hover:bg-plate-blue-dark text-white'
                            : 'bg-well hover:bg-rule/70 text-ink'
                        }`}
                      >
                        เริ่ม
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleStartWorkout('เลือกท่าเอง')}
                className="py-2.5 px-3 rounded-md border border-dashed border-faint text-xs font-medium text-mute hover:text-ink hover:border-ink transition-colors text-center"
              >
                เริ่มแบบเลือกท่าเอง
              </button>
              <button
                type="button"
                onClick={() => setIsAddExerciseOpen(true)}
                className="py-2.5 px-3 rounded-md border border-rule bg-paper text-xs font-semibold text-plate-blue hover:border-plate-blue transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                คลังท่า / เพิ่มท่าใหม่
              </button>
            </div>
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
        onCreateCustomExercise={handleCreateCustomExercise}
      />

      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        exercises={exercises}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelectExercise={handleSelectExercise}
        onCreateCustomExercise={handleCreateCustomExercise}
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

      {/* Quick Swap Routine Days Modal on Home Screen */}
      {homeSwappingRoutine && (
        <Sheet
          title={`สลับวัน: ${homeSwappingRoutine.name}`}
          description={`ปัจจุบันคือวัน${homeSwappingRoutine.day} — เลือกตารางที่ต้องการสลับวันด้วย:`}
          onClose={() => setHomeSwappingRoutine(null)}
          size="md"
        >
          <div className="p-4 space-y-2">
            {routines
              .filter((r) => r.id !== homeSwappingRoutine.id)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    handleHomeSwapRoutines(homeSwappingRoutine.id, r.id);
                    setHomeSwappingRoutine(null);
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
    </main>
  );
}
