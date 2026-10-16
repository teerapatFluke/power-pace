import { Exercise, WorkoutSession } from '@/types/workout';
import { supabase, isSupabaseConfigured } from './supabase';
import { DEFAULT_EXERCISES } from './defaultExercises';
import { WORKOUT_ROUTINES, RoutinePreset } from './workoutRoutines';

const ACTIVE_WORKOUT_KEY = 'power_pace_active_workout';
const HISTORY_KEY = 'power_pace_workout_history';
const CUSTOM_EXERCISES_KEY = 'power_pace_custom_exercises';
const ROUTINES_KEY = 'power_pace_routines';

export function getLocalRoutines(): RoutinePreset[] {
  if (typeof window === 'undefined') return WORKOUT_ROUTINES;
  const raw = localStorage.getItem(ROUTINES_KEY);
  if (!raw) return WORKOUT_ROUTINES;
  try {
    return JSON.parse(raw);
  } catch {
    return WORKOUT_ROUTINES;
  }
}

export function saveLocalRoutines(routines: RoutinePreset[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export function resetLocalRoutines(): RoutinePreset[] {
  if (typeof window === 'undefined') return WORKOUT_ROUTINES;
  localStorage.removeItem(ROUTINES_KEY);
  return WORKOUT_ROUTINES;
}

// --- Local Storage Helpers ---
export function getLocalActiveWorkout(): WorkoutSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ACTIVE_WORKOUT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalActiveWorkout(workout: WorkoutSession | null) {
  if (typeof window === 'undefined') return;
  if (!workout) {
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
  } else {
    localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(workout));
  }
}

export function getLocalWorkoutHistory(): WorkoutSession[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalWorkoutHistory(workout: WorkoutSession) {
  if (typeof window === 'undefined') return;
  const history = getLocalWorkoutHistory();
  const filtered = history.filter((w) => w.id !== workout.id);
  const updated = [workout, ...filtered];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getLocalExercises(): Exercise[] {
  if (typeof window === 'undefined') return DEFAULT_EXERCISES;
  const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY);
  let custom: Exercise[] = [];
  if (raw) {
    try {
      custom = JSON.parse(raw);
    } catch {
      custom = [];
    }
  }
  return [...DEFAULT_EXERCISES, ...custom];
}

export function saveLocalCustomExercise(exercise: Exercise) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY);
  let custom: Exercise[] = raw ? JSON.parse(raw) : [];
  custom = [...custom.filter((e) => e.id !== exercise.id), exercise];
  localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(custom));
}

// Find previous performance for an exercise
export function findLastPerformance(exerciseId: string, exerciseName: string) {
  const history = getLocalWorkoutHistory();
  for (const session of history) {
    const match = session.exercises.find(
      (e) => e.exercise_id === exerciseId || e.exercise_name === exerciseName
    );
    if (match && match.sets.length > 0) {
      // Find the heaviest completed set or last set
      const completedSets = match.sets.filter((s) => s.is_completed);
      const targetSet = completedSets.length > 0 ? completedSets[completedSets.length - 1] : match.sets[0];
      return {
        weight_or_pin: targetSet.weight_or_pin,
        reps: targetSet.reps,
        unit_type: match.unit_type,
      };
    }
  }
  return null;
}

// --- Supabase Sync Helpers ---
export async function syncWorkoutToSupabase(workout: WorkoutSession): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'ไม่ได้ตั้งค่า Supabase' };
  }

  try {
    // 1. Insert or Upsert Workout
    const { error: wError } = await supabase.from('workouts').upsert({
      id: workout.id,
      title: workout.title,
      date: workout.date,
      duration_seconds: workout.duration_seconds,
    });

    if (wError) throw wError;

    // 2. Insert Exercises and Sets
    for (let i = 0; i < workout.exercises.length; i++) {
      const we = workout.exercises[i];
      const { error: weError } = await supabase.from('workout_exercises').upsert({
        id: we.id,
        workout_id: workout.id,
        exercise_name: we.exercise_name,
        category: we.category,
        unit_type: we.unit_type,
        order_index: i,
      });

      if (weError) throw weError;

      // Sets
      for (const s of we.sets) {
        const { error: sError } = await supabase.from('exercise_sets').upsert({
          id: s.id,
          workout_exercise_id: we.id,
          set_number: s.set_number,
          weight_or_pin: s.weight_or_pin,
          reps: s.reps,
          is_completed: s.is_completed,
          rpe: s.rpe || null,
        });
        if (sError) throw sError;
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Supabase sync warning:', message);
    return { success: false, error: message };
  }
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { connected: false, message: 'Supabase URL/Key ยังไม่สมบูรณ์' };
  }
  try {
    const { error } = await supabase.from('workouts').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return { connected: true, message: 'เชื่อมต่อแล้ว แต่ยังไม่ได้สร้าง Table (รัน SQL ใน schema.sql)' };
      }
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'เชื่อมต่อ Supabase สำเร็จ พร้อมบันทึกข้อมูล' };
  } catch (err: unknown) {
    return { connected: false, message: err instanceof Error ? err.message : 'เชื่อมต่อไม่สำเร็จ' };
  }
}
