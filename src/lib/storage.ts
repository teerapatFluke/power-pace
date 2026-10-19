import { Exercise, WorkoutSession, WorkoutExercise, GymLocation } from '@/types/workout';
import { supabase, isSupabaseConfigured } from './supabase';
import { WORKOUT_ROUTINES, RoutinePreset } from './workoutRoutines';
import { DEFAULT_LOCATIONS } from './defaultLocations';

const ACTIVE_WORKOUT_PREFIX = 'power_pace_active_workout';
const HISTORY_PREFIX = 'power_pace_workout_history';
const ROUTINES_PREFIX = 'power_pace_routines';
const CUSTOM_EXERCISES_KEY = 'power_pace_custom_exercises';
const EXERCISES_CACHE_KEY = 'power_pace_exercises_cache';
const LOCATIONS_KEY = 'power_pace_gym_locations';
const SELECTED_LOCATION_KEY = 'power_pace_selected_location';

function getUserStorageKey(prefix: string, userId?: string | null): string {
  return `${prefix}_${userId || 'guest'}`;
}

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

// --- User Isolated Routines ---
export function getLocalRoutines(userId?: string | null): RoutinePreset[] {
  if (typeof window === 'undefined') return WORKOUT_ROUTINES;
  const key = getUserStorageKey(ROUTINES_PREFIX, userId);
  const raw = localStorage.getItem(key);
  if (!raw) return WORKOUT_ROUTINES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : WORKOUT_ROUTINES;
  } catch {
    return WORKOUT_ROUTINES;
  }
}

export function saveLocalRoutines(routines: RoutinePreset[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  const key = getUserStorageKey(ROUTINES_PREFIX, userId);
  localStorage.setItem(key, JSON.stringify(routines));
}

export function resetLocalRoutines(userId?: string | null): RoutinePreset[] {
  if (typeof window === 'undefined') return WORKOUT_ROUTINES;
  const key = getUserStorageKey(ROUTINES_PREFIX, userId);
  localStorage.removeItem(key);
  return WORKOUT_ROUTINES;
}

// Fetch user's private routines from Supabase
export async function fetchRoutinesFromSupabase(userId?: string | null): Promise<RoutinePreset[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data?.user?.id;
    }
    // Guests only use local browser routines
    if (!uid) return null;

    // 1. Try querying with user_id column
    let { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', uid)
      .order('order_index', { ascending: true });

    // 2. Fallback: if user_id column is not in DB yet, query by user-prefixed id
    if (error && (error.message?.includes('user_id') || error.code === '42703')) {
      const fallback = await supabase
        .from('routines')
        .select('*')
        .like('id', `${uid}_%`)
        .order('order_index', { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn('Could not fetch routines from Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((r) => {
        const cleanId = r.id.startsWith(`${uid}_`) ? r.id.replace(`${uid}_`, '') : r.id;
        return {
          id: cleanId,
          day: r.day,
          name: r.name,
          focus: r.focus,
          exerciseIds: Array.isArray(r.exercise_ids)
            ? r.exercise_ids
            : JSON.parse(r.exercise_ids || '[]'),
        };
      });
    }

    return [];
  } catch (e) {
    console.warn('Supabase routines fetch error:', e);
    return null;
  }
}

// Sync user's private routines to Supabase (isolated with user_id & unique prefix)
export async function syncRoutinesToSupabase(
  routines: RoutinePreset[],
  userId?: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data?.user?.id;
    }
    if (!uid) return false;

    // Payload with user_id & prefixed id to guarantee zero collision across users
    const payloadWithUser = routines.map((r, index) => ({
      id: `${uid}_${r.id}`,
      user_id: uid,
      day: r.day,
      name: r.name,
      focus: r.focus,
      exercise_ids: r.exerciseIds,
      order_index: index,
      updated_at: new Date().toISOString(),
    }));

    // Clean up removed routine days for this user
    const activeIds = payloadWithUser.map((p) => p.id);
    try {
      const { data: existing } = await supabase
        .from('routines')
        .select('id')
        .eq('user_id', uid);
      if (existing && existing.length > 0) {
        const toDelete = existing
          .map((e) => e.id)
          .filter((id) => !activeIds.includes(id));
        if (toDelete.length > 0) {
          await supabase.from('routines').delete().in('id', toDelete);
        }
      }
    } catch {
      // ignore
    }

    let { error } = await supabase.from('routines').upsert(payloadWithUser);

    // Fallback if user_id column doesn't exist yet in Supabase table
    if (error && (error.message?.includes('user_id') || error.code === '42703')) {
      const payloadWithoutUserCol = routines.map((r, index) => ({
        id: `${uid}_${r.id}`,
        day: r.day,
        name: r.name,
        focus: r.focus,
        exercise_ids: r.exerciseIds,
        order_index: index,
        updated_at: new Date().toISOString(),
      }));
      const fallback = await supabase.from('routines').upsert(payloadWithoutUserCol);
      error = fallback.error;
    }

    if (error) {
      console.warn('Could not sync user routines to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase user routines sync error:', e);
    return false;
  }
}

// --- User Isolated Active Workout & History ---
export function getLocalActiveWorkout(userId?: string | null): WorkoutSession | null {
  if (typeof window === 'undefined') return null;
  const key = getUserStorageKey(ACTIVE_WORKOUT_PREFIX, userId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalActiveWorkout(workout: WorkoutSession | null, userId?: string | null) {
  if (typeof window === 'undefined') return;
  const key = getUserStorageKey(ACTIVE_WORKOUT_PREFIX, userId);
  if (!workout) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(workout));
  }
}

export function getLocalWorkoutHistory(userId?: string | null): WorkoutSession[] {
  if (typeof window === 'undefined') return [];
  const key = getUserStorageKey(HISTORY_PREFIX, userId);
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalWorkoutHistory(workout: WorkoutSession, userId?: string | null) {
  if (typeof window === 'undefined') return;
  const history = getLocalWorkoutHistory(userId);
  const filtered = history.filter((w) => w.id !== workout.id);
  const updated = [workout, ...filtered];
  const key = getUserStorageKey(HISTORY_PREFIX, userId);
  localStorage.setItem(key, JSON.stringify(updated));
}

// --- 100% Online Exercises Library ---
export function getLocalExercises(): Exercise[] {
  if (typeof window === 'undefined') return [];
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
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
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

export async function saveLocalCustomExercise(exercise: Exercise): Promise<Exercise> {
  const cleanExercise: Exercise = {
    ...exercise,
    name: exercise.name.trim(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .upsert(
          {
            name: cleanExercise.name,
            category: cleanExercise.category,
            unit_type: cleanExercise.unit_type,
          },
          { onConflict: 'name' }
        )
        .select('id, name, category, unit_type')
        .single();

      if (!error && data) {
        const saved: Exercise = {
          id: String(data.id),
          name: data.name,
          category: data.category,
          unit_type: data.unit_type,
          custom: true,
        };
        // Refresh online exercises
        await fetchExercisesFromSupabase();
        return saved;
      } else if (error) {
        console.warn('Could not sync custom exercise to Supabase:', error.message);
      }
    } catch (e) {
      console.warn('Could not sync custom exercise to Supabase:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    let custom: Exercise[] = raw ? JSON.parse(raw) : [];
    custom = [
      ...custom.filter(
        (e) =>
          e.id !== cleanExercise.id &&
          e.name.toLowerCase() !== cleanExercise.name.toLowerCase()
      ),
      cleanExercise,
    ];
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(custom));
  }
  return cleanExercise;
}

// Smart exercise matcher: matches by id (exact or lowercase), exact name, slug, or keywords
export function findExerciseMatch(
  exercises: Exercise[],
  idOrKey: string
): Exercise | undefined {
  if (!idOrKey) return undefined;
  
  // 1. Direct ID match
  const byId = exercises.find((e) => e.id === idOrKey);
  if (byId) return byId;

  // 2. Case-insensitive ID match
  const byIdLower = exercises.find((e) => e.id.toLowerCase() === idOrKey.toLowerCase());
  if (byIdLower) return byIdLower;

  // 3. Name exact match
  const byName = exercises.find(
    (e) => e.name.toLowerCase() === idOrKey.toLowerCase()
  );
  if (byName) return byName;

  // 4. Keyword / slug matching for presets
  const normalizedKey = idOrKey.toLowerCase().replace(/[-_]/g, ' ');
  const byKeyword = exercises.find((e) => {
    const n = e.name.toLowerCase();
    return n.includes(normalizedKey) || normalizedKey.includes(n);
  });
  if (byKeyword) return byKeyword;

  // 5. Common preset slug keywords
  const slugKeywords: Record<string, string[]> = {
    'chest-press-machine': ['chest press machine', 'เครื่องดันอก', 'อกกลางเครื่อง'],
    'incline-db-press': ['incline dumbbell press', 'ดัมเบลอกบน'],
    'incline-chest-press': ['incline chest press', 'อกบนเครื่อง', 'เน้นอกบน'],
    'shoulder-press-machine': ['shoulder press machine', 'เครื่องดันไหล่', 'ไหล่หน้า'],
    'lateral-raise': ['lateral raise', 'ไหล่ข้าง', 'ยกไหล่ข้าง'],
    'triceps-pressdown': ['triceps pressdown', 'เคเบิลกดหลังแขน', 'หลังแขน'],
    'lat-pulldown': ['lat pulldown', 'ดึงหลัง', 'ดึงปีก'],
    'mid-row-machine': ['mid row machine', 'ดึงสะบักเครื่อง', 'หลังสะบัก'],
    'rear-delt-fly': ['rear delt fly', 'เครื่องไหล่หลัง', 'ไหล่หลัง'],
    'bicep-curl': ['bicep curl', 'ดัมเบลหน้าแขน', 'หน้าแขน'],
    'hammer-curl': ['hammer curl', 'ดัมเบลแฮมเมอร์', 'ลำแขน'],
    'leg-press': ['leg press', 'เครื่องเลกเพรส', 'ขารวม/ก้น'],
    'leg-extension': ['leg extension', 'เครื่องเตะหน้าขา', 'เตะขาหน้า', 'หน้าขา'],
    'lying-leg-curl': ['lying leg curl', 'เครื่องนอนพับขา', 'ดึงขาหลัง', 'หลังขา'],
    'calf-raises': ['calf raise', 'เขย่งน่อง', 'น่อง'],
    'ab-crunch-machine': ['ab crunch', 'เครื่องซิทอัพหน้าท้อง', 'หน้าท้อง', 'sit-up', 'ซิทอัพ'],
    'bicep-triceps-superset': ['bicep curl / triceps pressdown', 'สลับเล่น', 'bicep'],
    'sit-up': ['sit-up', 'crunches', 'ซิทอัพหน้าท้อง'],
  };

  const keywords = slugKeywords[idOrKey];
  if (keywords) {
    const match = exercises.find((e) => {
      const lower = e.name.toLowerCase();
      return keywords.some((kw) => lower.includes(kw));
    });
    if (match) return match;
  }

  return undefined;
}

// Find previous performance for an exercise (STRICTLY isolated to the current gym location only)
export function findLastPerformance(
  exerciseId: string,
  exerciseName: string,
  currentLocationId?: string,
  currentLocationName?: string,
  userId?: string | null
) {
  const history = getLocalWorkoutHistory(userId);

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

// Fetch Workout History from Supabase (strictly isolated to logged-in user)
export async function fetchWorkoutHistoryFromSupabase(
  userId?: string | null
): Promise<WorkoutSession[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data?.user?.id;
    }
    if (!uid) return null;

    const { data: workoutsData, error: wError } = await supabase
      .from('workouts')
      .select('id, title, date, duration_seconds, location_name, created_at')
      .eq('user_id', uid)
      .order('date', { ascending: false });

    if (wError || !workoutsData || workoutsData.length === 0) return [];

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

