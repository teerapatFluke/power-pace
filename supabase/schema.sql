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


-- 6. Insert 68 Popular Gym Exercises Library
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exercises_name_key'
  ) THEN
    ALTER TABLE exercises ADD CONSTRAINT exercises_name_key UNIQUE (name);
  END IF;
END $$;

INSERT INTO exercises (name, category, unit_type) VALUES
  -- อก (Chest)
  ('Chest Press Machine (อกกลางเครื่อง)', 'Chest', 'pin'),
  ('Incline Chest Press (อกบนเครื่อง)', 'Chest', 'pin'),
  ('Incline Dumbbell Press (ดัมเบลอกบน)', 'Chest', 'kg'),
  ('Dumbbell Bench Press (ดัมเบลอกราบ)', 'Chest', 'kg'),
  ('Pec Deck / Chest Fly (เครื่องหนีบอก)', 'Chest', 'pin'),
  ('Barbell Bench Press (บาร์เบลอกราบ)', 'Chest', 'kg'),
  ('Incline Barbell Press (บาร์เบลอกบน)', 'Chest', 'kg'),
  ('Decline Dumbbell Press (ดัมเบลอกล่าง)', 'Chest', 'kg'),
  ('Cable Crossover / Fly (เคเบิลหนีบอก)', 'Chest', 'pin'),
  ('Low to High Cable Fly (เคเบิลเสยอกบน)', 'Chest', 'pin'),
  ('Chest Dips (ดิปส์อก)', 'Chest', 'bodyweight'),
  ('Push-ups (วิดพื้น)', 'Chest', 'bodyweight'),

  -- หลัง (Back)
  ('Lat Pulldown (ดึงปีกกว้างเครื่อง)', 'Back', 'pin'),
  ('Mid Row Machine (ดึงสะบักเครื่อง)', 'Back', 'pin'),
  ('Seated Cable Row (เคเบิลงัดหลัง)', 'Back', 'pin'),
  ('Pull-ups (โหนบาร์)', 'Back', 'bodyweight'),
  ('Barbell Deadlift (บาร์เบลเดดลิฟต์)', 'Back', 'kg'),
  ('Close-Grip Lat Pulldown (ดึงปีกจับแคบ)', 'Back', 'pin'),
  ('Barbell Bent Over Row (บาร์เบลโรว์)', 'Back', 'kg'),
  ('Single-Arm Dumbbell Row (ดัมเบลโรว์)', 'Back', 'kg'),
  ('T-Bar Row (ทีบาร์โรว์)', 'Back', 'kg'),
  ('Straight-Arm Cable Pulldown (เคเบิลกดปีก)', 'Back', 'pin'),
  ('Assisted Pull-up (เครื่องช่วยโหนบาร์)', 'Back', 'pin'),
  ('Back Extension / Hyperextension (หลังล่าง)', 'Back', 'bodyweight'),

  -- ไหล่ (Shoulders)
  ('Shoulder Press Machine (เครื่องดันไหล่)', 'Shoulders', 'pin'),
  ('Dumbbell Lateral Raise (ดัมเบลยกไหล่ข้าง)', 'Shoulders', 'kg'),
  ('Rear Delt Fly Machine (เครื่องไหล่หลัง)', 'Shoulders', 'pin'),
  ('Dumbbell Shoulder Press (ดัมเบลดันไหล่)', 'Shoulders', 'kg'),
  ('Overhead Press / OHP (บาร์เบลดันไหล่)', 'Shoulders', 'kg'),
  ('Cable Lateral Raise (เคเบิลยกไหล่ข้าง)', 'Shoulders', 'pin'),
  ('Face Pull (เคเบิลดึงหน้าไหล่หลัง)', 'Shoulders', 'pin'),
  ('Dumbbell Front Raise (ยกไหล่หน้า)', 'Shoulders', 'kg'),
  ('Bent-Over Dumbbell Fly (ดัมเบลไหล่หลัง)', 'Shoulders', 'kg'),
  ('Dumbbell Shrug (ดัมเบลยักไหล่/ทราพีเซียส)', 'Shoulders', 'kg'),
  ('Barbell Shrug (บาร์เบลยักไหล่)', 'Shoulders', 'kg'),

  -- แขน (Arms)
  ('Triceps Pressdown (เคเบิลกดหลังแขน)', 'Arms', 'pin'),
  ('Dumbbell Bicep Curl (ดัมเบลหน้าแขน)', 'Arms', 'kg'),
  ('Hammer Curl (ดัมเบลแฮมเมอร์)', 'Arms', 'kg'),
  ('Bicep Curl / Triceps Pressdown (สลับเล่น)', 'Arms', 'pin'),
  ('Barbell / EZ-Bar Curl (บาร์เบลหน้าแขน)', 'Arms', 'kg'),
  ('Incline Dumbbell Curl (หน้าแขนเบาะเอียง)', 'Arms', 'kg'),
  ('Preacher Curl (พรีเชอร์เคิร์ลแท่นวาง)', 'Arms', 'kg'),
  ('Cable Bicep Curl (เคเบิลหน้าแขน)', 'Arms', 'pin'),
  ('Triceps Rope Pushdown (เชือกกดหลังแขน)', 'Arms', 'pin'),
  ('Skull Crusher / Lying Triceps Extension (นอนดันหลังแขน)', 'Arms', 'kg'),
  ('Overhead Cable Triceps Extension (เคเบิลข้ามหัว)', 'Arms', 'pin'),
  ('Triceps Bench Dips (ดิปส์หลังแขน)', 'Arms', 'bodyweight'),

  -- ขาและก้น (Legs & Glutes)
  ('Leg Press Machine (เครื่องเลกเพรส)', 'Legs', 'kg'),
  ('Leg Extension (เครื่องเตะหน้าขา)', 'Legs', 'pin'),
  ('Lying Leg Curl (เครื่องนอนพับขา)', 'Legs', 'pin'),
  ('Calf Raises (เขย่งน่อง)', 'Legs', 'kg'),
  ('Barbell Back Squat (บาร์เบลสควอท)', 'Legs', 'kg'),
  ('Romanian Deadlift / RDL (ขาหลัง/ก้น)', 'Legs', 'kg'),
  ('Hack Squat (เครื่องแฮ็คสควอท)', 'Legs', 'kg'),
  ('Smith Machine Squat (สมิธสควอท)', 'Legs', 'kg'),
  ('Bulgarian Split Squat (ดัมเบลขาเดี่ยว)', 'Legs', 'kg'),
  ('Walking Lunges (ดัมเบลเดินก้าวขา)', 'Legs', 'kg'),
  ('Seated Leg Curl (เครื่องนั่งพับขา)', 'Legs', 'pin'),
  ('Barbell Hip Thrust (บาร์เบลยกสะโพก/ก้น)', 'Legs', 'kg'),
  ('Hip Abductor Machine (เครื่องอ้าขาก้นข้าง)', 'Legs', 'pin'),
  ('Hip Adductor Machine (เครื่องหุบขาหนีบ)', 'Legs', 'pin'),
  ('Seated Calf Raise (เครื่องนั่งเขย่งน่อง)', 'Legs', 'kg'),

  -- แกนกลาง / ท้อง (Core / Abs)
  ('Ab Crunch Machine (เครื่องซิทอัพหน้าท้อง)', 'Core', 'pin'),
  ('Cable Kneeling Crunch (เคเบิลคุกเข่าซิทอัพ)', 'Core', 'pin'),
  ('Hanging Leg Raise (โหนบาร์ยกขา)', 'Core', 'bodyweight'),
  ('Plank (แพลงก์จับเวลา)', 'Core', 'bodyweight'),
  ('Russian Twist (รัสเซียนทวิสต์บิดเอว)', 'Core', 'kg'),
  ('Cable Woodchopper (เคเบิลบิดเอว)', 'Core', 'pin')
ON CONFLICT (name) DO UPDATE 
SET category = EXCLUDED.category,
    unit_type = EXCLUDED.unit_type;

