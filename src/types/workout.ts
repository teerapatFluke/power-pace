export type UnitType = 'kg' | 'pin' | 'lbs' | 'bodyweight';

export type MuscleCategory =
  | 'All'
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  unit_type: UnitType;
  custom?: boolean;
}

export interface ExerciseSet {
  id: string;
  set_number: number;
  weight_or_pin: number; // e.g. 20 (kg) or 4 (pin #4)
  reps: number;
  is_completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  category: MuscleCategory;
  unit_type: UnitType;
  sets: ExerciseSet[];
  notes?: string;
  previous_performance?: {
    weight_or_pin: number;
    reps: number;
    unit_type: UnitType;
  };
}

export interface WorkoutSession {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  duration_seconds: number;
  exercises: WorkoutExercise[];
  is_completed: boolean;
  created_at?: string;
}
