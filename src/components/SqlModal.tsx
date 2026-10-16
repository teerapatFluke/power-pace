'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import Sheet from './Sheet';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCRIPT = `-- ==========================================
-- POWER PACE: SUPABASE DATABASE SCHEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit_type TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read allowed_emails" ON allowed_emails FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Workout',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INT DEFAULT 0,
  location_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit_type TEXT NOT NULL DEFAULT 'kg',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  focus TEXT,
  exercise_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access routines" ON routines FOR ALL USING (true) WITH CHECK (true);


-- 68 ท่ายอดฮิต (เครื่อง Machine แผ่นที่ + Free Weight กิโลกรัม)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercises_name_key') THEN
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
`;

export default function SqlModal({ isOpen, onClose }: SqlModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet
      title="สร้างตารางบน Supabase"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2.5 border border-rule bg-paper text-ink text-sm rounded-md hover:bg-well"
        >
          ปิด
        </button>
      }
    >
        <div className="flex flex-col gap-3 px-5 py-4">
          <p className="text-sm text-mute">
            นำโค้ด SQL ด้านล่างไปรันใน{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-plate-blue font-medium inline-flex items-center gap-0.5 hover:underline"
            >
              Supabase Dashboard <ExternalLink className="w-3 h-3" />
            </a>{' '}
            &gt; <span className="text-ink">SQL Editor</span> &gt;{' '}
            <span className="text-ink">New query</span> แล้ววางโค้ดและกด{' '}
            <span className="text-ink">Run</span>
          </p>

          {/* Code Block */}
          <div className="relative max-h-[50vh] bg-ink text-paper rounded-lg p-3 overflow-y-auto no-scrollbar font-mono text-xs">
            <button
              type="button"
              onClick={handleCopy}
              className={`sticky top-0 float-right ml-2 px-3 py-1.5 rounded-md font-sans font-semibold text-sm flex items-center gap-1 ${
                copied
                  ? 'bg-plate-green text-white'
                  : 'bg-plate-blue hover:bg-plate-blue-dark text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> คัดลอก SQL
                </>
              )}
            </button>
            <pre className="whitespace-pre-wrap">{SQL_SCRIPT}</pre>
          </div>
        </div>
    </Sheet>
  );
}
