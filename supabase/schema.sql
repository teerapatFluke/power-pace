-- ==========================================
-- POWER PACE: SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Dashboard -> SQL Editor -> Run
-- ==========================================

-- 1. Exercises Library
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit_type TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'pin', 'lbs', 'bodyweight'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workout Sessions
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Workout',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workout Exercises (Exercises added to a specific workout)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit_type TEXT NOT NULL DEFAULT 'kg',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sets in each exercise
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  weight_or_pin NUMERIC NOT NULL DEFAULT 0,
  reps INT NOT NULL DEFAULT 10,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  rpe NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create open policies for anon public key
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access exercises" ON exercises;
CREATE POLICY "Public access exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access workouts" ON workouts;
CREATE POLICY "Public access workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access workout_exercises" ON workout_exercises;
CREATE POLICY "Public access workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access exercise_sets" ON exercise_sets;
CREATE POLICY "Public access exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);

-- Insert Default Exercises (Preloaded with both Pin and Free-weight exercises)
INSERT INTO exercises (name, category, unit_type) VALUES
  ('Lat Pulldown (ดึงหลัง)', 'Back', 'pin'),
  ('Seated Cable Row (เคเบิลงัดหลัง)', 'Back', 'pin'),
  ('Chest Press Machine (เครื่องดันอก)', 'Chest', 'pin'),
  ('Leg Extension (เตะขาหน้า)', 'Legs', 'pin'),
  ('Leg Curl (ดึงขาหลัง)', 'Legs', 'pin'),
  ('Cable Triceps Pushdown', 'Arms', 'pin'),
  ('Dumbbell Bench Press', 'Chest', 'kg'),
  ('Incline Dumbbell Press', 'Chest', 'kg'),
  ('Dumbbell Biceps Curl', 'Arms', 'kg'),
  ('Dumbbell Lateral Raise (ยกข้าง)', 'Shoulders', 'kg'),
  ('Dumbbell Shoulder Press', 'Shoulders', 'kg'),
  ('Barbell Squat', 'Legs', 'kg'),
  ('Barbell Deadlift', 'Back', 'kg'),
  ('Pull-ups (โหนบาร์)', 'Back', 'bodyweight')
ON CONFLICT DO NOTHING;
