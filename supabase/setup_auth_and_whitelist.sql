-- =======================================================
-- POWER PACE: AUTH & WHITELIST DATABASE SETUP
-- รันคำสั่งนี้ใน Supabase Dashboard -> SQL Editor -> Run
-- =======================================================

-- 1. ตาราง Whitelist เก็บรายชื่ออีเมลที่อนุญาตให้เข้าใช้งานระบบ
CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิด Row Level Security (RLS)
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้อ่านตาราง allowed_emails เพื่อตรวจสอบตอนล็อกอิน
DROP POLICY IF EXISTS "Allow read allowed_emails" ON allowed_emails;
CREATE POLICY "Allow read allowed_emails" ON allowed_emails 
  FOR SELECT USING (true);

-- 2. เพิ่ม Email ของคุณและผู้ใช้ที่อนุญาต (แก้ไขตรงนี้เป็นอีเมลจริงของคุณ)
INSERT INTO allowed_emails (email, note) VALUES
  ('admin@powerpace.app', 'ผู้ดูแลระบบ'),
  ('teerapat.fluke@gmail.com', 'Admin / เจ้าของ')
ON CONFLICT (email) DO NOTHING;

-- 3. เพิ่มคอลัมน์ user_id ในตาราง workouts และ routines เพื่อแยกข้อมูลผู้ใช้
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. ตั้งค่า RLS สำหรับ workouts ให้แต่ละคนเข้าถึงได้เฉพาะข้อมูลของตัวเอง
DROP POLICY IF EXISTS "Public access workouts" ON workouts;
DROP POLICY IF EXISTS "Users can only access own workouts" ON workouts;
CREATE POLICY "Users can only access own workouts" ON workouts
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- 5. ตั้งค่า RLS สำหรับ workout_exercises และ exercise_sets ให้สิทธิ์เชื่อมโยงกับ workout ของเจ้าของ
DROP POLICY IF EXISTS "Public access workout_exercises" ON workout_exercises;
CREATE POLICY "Users access own workout_exercises" ON workout_exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND (workouts.user_id = auth.uid() OR workouts.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND workouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public access exercise_sets" ON exercise_sets;
CREATE POLICY "Users access own exercise_sets" ON exercise_sets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id
      AND (workouts.user_id = auth.uid() OR workouts.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id
      AND workouts.user_id = auth.uid()
    )
  );

-- 6. ตั้งค่า RLS สำหรับ routines ให้แต่ละคนเข้าถึงและแก้ไขได้เฉพาะตารางของตัวเอง (ของใครของมัน)
DROP POLICY IF EXISTS "Public access routines" ON routines;
DROP POLICY IF EXISTS "Users can only access own routines" ON routines;
CREATE POLICY "Users can only access own routines" ON routines
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);
