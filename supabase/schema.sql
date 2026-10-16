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
  location_name TEXT,
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

-- 5. Weekly Routines (ตารางฝึกซ้อมประจำสัปดาห์)
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  focus TEXT,
  exercise_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create open policies for anon public key
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access exercises" ON exercises;
CREATE POLICY "Public access exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access workouts" ON workouts;
CREATE POLICY "Public access workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access workout_exercises" ON workout_exercises;
CREATE POLICY "Public access workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access exercise_sets" ON exercise_sets;
CREATE POLICY "Public access exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access routines" ON routines;
CREATE POLICY "Public access routines" ON routines FOR ALL USING (true) WITH CHECK (true);


-- Insert User's Weekly Routine Exercises
INSERT INTO exercises (name, category, unit_type) VALUES
  -- จันทร์ (Push)
  ('Chest Press Machine (อกกลาง)', 'Chest', 'pin'),
  ('Incline Dumbbell Press (อกบน)', 'Chest', 'kg'),
  ('Shoulder Press Machine (ไหล่หน้า)', 'Shoulders', 'pin'),
  ('Lateral Raise (ไหล่ข้าง)', 'Shoulders', 'kg'),
  ('Triceps Pressdown (หลังแขน)', 'Arms', 'pin'),

  -- อังคาร (Pull)
  ('Lat Pulldown (หลังปีก/กว้าง)', 'Back', 'pin'),
  ('Mid Row Machine (หลังสะบัก/หนา)', 'Back', 'pin'),
  ('Rear Delt Fly (ไหล่หลัง)', 'Shoulders', 'pin'),
  ('Bicep Curl (หน้าแขน)', 'Arms', 'kg'),
  ('Hammer Curl (ลำแขน)', 'Arms', 'kg'),

  -- พุธ (Legs)
  ('Leg Press (ขารวม/ก้น)', 'Legs', 'kg'),
  ('Leg Extension (หน้าขา)', 'Legs', 'pin'),
  ('Lying Leg Curl (หลังขา)', 'Legs', 'pin'),
  ('Calf Raises (น่อง)', 'Legs', 'kg'),
  ('Ab Crunch Machine (หน้าท้อง)', 'Core', 'pin'),

  -- ศุกร์ (Upper) / เสาร์ (Lower)
  ('Incline Chest Press (เน้นอกบน)', 'Chest', 'pin'),
  ('Bicep Curl / Triceps Pressdown (สลับเล่น)', 'Arms', 'pin')
ON CONFLICT DO NOTHING;

