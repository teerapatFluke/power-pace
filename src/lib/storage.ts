import { Exercise, WorkoutSession, WorkoutExercise, GymLocation } from '@/types/workout';
import { supabase, isSupabaseConfigured } from './supabase';
import { DEFAULT_EXERCISES } from './defaultExercises';
import { WORKOUT_ROUTINES, RoutinePreset } from './workoutRoutines';
import { DEFAULT_LOCATIONS } from './defaultLocations';

const ACTIVE_WORKOUT_KEY = 'power_pace_active_workout';
const HISTORY_KEY = 'power_pace_workout_history';
const CUSTOM_EXERCISES_KEY = 'power_pace_custom_exercises';
const ROUTINES_KEY = 'power_pace_routines';
const LOCATIONS_KEY = 'power_pace_gym_locations';
const SELECTED_LOCATION_KEY = 'power_pace_selected_location';

export function getLocalLocations(): GymLocation[] {
  if (typeof window === 'undefined') return DEFAULT_LOCATIONS;
  const raw = localStorage.getItem(LOCATIONS_KEY);
  if (!raw) return DEFAULT_LOCATIONS;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOCATIONS;
  }
}

export function saveLocalLocations(locations: GymLocation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
}

export function getSelectedLocation(): GymLocation {
  const list = getLocalLocations();
  if (typeof window === 'undefined') return list[0] || DEFAULT_LOCATIONS[0];
  const raw = localStorage.getItem(SELECTED_LOCATION_KEY);
  if (raw) {
    try {
      const loc = JSON.parse(raw);
      const exists = list.find((l) => l.id === loc.id);
      if (exists) return exists;
    } catch {
      // ignore
    }
  }
  return list[0] || DEFAULT_LOCATIONS[0];
}

export function setSelectedLocation(location: GymLocation): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_LOCATION_KEY, JSON.stringify(location));
}


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

// --- Supabase Routines Sync ---
export async function fetchRoutinesFromSupabase(): Promise<RoutinePreset[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('Could not fetch routines from Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((r) => ({
        id: r.id,
        day: r.day,
        name: r.name,
        focus: r.focus,
        exerciseIds: Array.isArray(r.exercise_ids)
          ? r.exercise_ids
          : JSON.parse(r.exercise_ids || '[]'),
      }));
    }
    return null;
  } catch (e) {
    console.warn('Supabase routines fetch error:', e);
    return null;
  }
}

export async function syncRoutinesToSupabase(routines: RoutinePreset[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload = routines.map((r, index) => ({
      id: r.id,
      day: r.day,
      name: r.name,
      focus: r.focus,
      exercise_ids: r.exerciseIds,
      order_index: index,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('routines').upsert(payload);
    if (error) {
      console.warn('Could not sync routines to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase routines sync error:', e);
    return false;
  }
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

const EXERCISES_CACHE_KEY = 'power_pace_exercises_cache';

export function getLocalExercises(): Exercise[] {
  if (typeof window === 'undefined') return DEFAULT_EXERCISES;
  const cached = localStorage.getItem(EXERCISES_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
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

export function saveLocalExercisesCache(exercises: Exercise[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(exercises));
}

export async function fetchExercisesFromSupabase(): Promise<Exercise[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, category, unit_type')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Could not fetch exercises from Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      const mapped: Exercise[] = data.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        unit_type: e.unit_type,
      }));
      saveLocalExercisesCache(mapped);
      return mapped;
    }
    return null;
  } catch (e) {
    console.warn('Supabase exercises fetch error:', e);
    return null;
  }
}

export async function saveLocalCustomExercise(exercise: Exercise) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY);
  let custom: Exercise[] = raw ? JSON.parse(raw) : [];
  custom = [...custom.filter((e) => e.id !== exercise.id), exercise];
  localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(custom));

  // Also sync to Supabase exercises table
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('exercises').upsert({
        name: exercise.name,
        category: exercise.category,
        unit_type: exercise.unit_type,
      });
    } catch (e) {
      console.warn('Could not sync custom exercise to Supabase:', e);
    }
  }
}

// Find previous performance for an exercise (STRICTLY isolated to the current gym location only)
export function findLastPerformance(
  exerciseId: string,
  exerciseName: string,
  currentLocationId?: string,
  currentLocationName?: string
) {
  const history = getLocalWorkoutHistory();

  if (!currentLocationId && !currentLocationName) return null;

  for (const session of history) {
    const isSameLocation =
      (currentLocationId && session.location_id === currentLocationId) ||
      (currentLocationName && session.location_name === currentLocationName);

    if (isSameLocation) {
      const match = session.exercises.find(
        (e) => e.exercise_id === exerciseId || e.exercise_name === exerciseName
      );
      if (match && match.sets.length > 0) {
        const completedSets = match.sets.filter((s) => s.is_completed);
        const targetSet =
          completedSets.length > 0
            ? completedSets[completedSets.length - 1]
            : match.sets[0];
        return {
          weight_or_pin: targetSet.weight_or_pin,
          reps: targetSet.reps,
          unit_type: match.unit_type,
          location_name: session.location_name,
          is_from_current_location: true,
        };
      }
    }
  }

  // Strictly isolated: do NOT leak plate numbers from other gyms!
  return null;
}

// --- Supabase Sync Helpers ---
export async function syncWorkoutToSupabase(workout: WorkoutSession): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'ไม่ได้ตั้งค่า Supabase' };
  }

  try {
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) userId = userData.user.id;
    } catch {
      // not logged in
    }

    // 1. Insert or Upsert Workout (including location and user_id)
    const { error: wError } = await supabase.from('workouts').upsert({
      id: workout.id,
      title: workout.title,
      date: workout.date,
      duration_seconds: workout.duration_seconds,
      location_name: workout.location_name || null,
      user_id: userId,
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

// Fetch Workout History from Supabase
export async function fetchWorkoutHistoryFromSupabase(): Promise<WorkoutSession[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: workoutsData, error: wError } = await supabase
      .from('workouts')
      .select('id, title, date, duration_seconds, location_name, created_at')
      .order('date', { ascending: false });

    if (wError || !workoutsData || workoutsData.length === 0) return null;

    const sessions: WorkoutSession[] = [];

    for (const w of workoutsData) {
      const { data: weData } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', w.id)
        .order('order_index', { ascending: true });

      const exercises: WorkoutExercise[] = [];

      if (weData) {
        for (const we of weData) {
          const { data: setsData } = await supabase
            .from('exercise_sets')
            .select('*')
            .eq('workout_exercise_id', we.id)
            .order('set_number', { ascending: true });

          exercises.push({
            id: we.id,
            exercise_id: we.id,
            exercise_name: we.exercise_name,
            category: we.category,
            unit_type: we.unit_type,
            sets: (setsData || []).map((s) => ({
              id: s.id,
              set_number: s.set_number,
              weight_or_pin: Number(s.weight_or_pin),
              reps: Number(s.reps),
              is_completed: Boolean(s.is_completed),
              rpe: s.rpe ? Number(s.rpe) : undefined,
            })),
          });
        }
      }

      sessions.push({
        id: w.id,
        title: w.title,
        date: w.date,
        duration_seconds: w.duration_seconds,
        location_name: w.location_name || undefined,
        exercises,
        is_completed: true,
      });
    }

    return sessions;
  } catch (err) {
    console.warn('Error fetching history from Supabase:', err);
    return null;
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

export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function signOutUser(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    await supabase.auth.signOut();
    return true;
  } catch (err) {
    console.warn('Sign out error:', err);
    return false;
  }
}

