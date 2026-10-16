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

CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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


-- ท่าประจำตารางฝึกซ้อม
INSERT INTO exercises (name, category, unit_type) VALUES
  ('Chest Press Machine (อกกลาง)', 'Chest', 'pin'),
  ('Incline Dumbbell Press (อกบน)', 'Chest', 'kg'),
  ('Shoulder Press Machine (ไหล่หน้า)', 'Shoulders', 'pin'),
  ('Lateral Raise (ไหล่ข้าง)', 'Shoulders', 'kg'),
  ('Triceps Pressdown (หลังแขน)', 'Arms', 'pin'),
  ('Lat Pulldown (หลังปีก/กว้าง)', 'Back', 'pin'),
  ('Mid Row Machine (หลังสะบัก/หนา)', 'Back', 'pin'),
  ('Rear Delt Fly (ไหล่หลัง)', 'Shoulders', 'pin'),
  ('Bicep Curl (หน้าแขน)', 'Arms', 'kg'),
  ('Hammer Curl (ลำแขน)', 'Arms', 'kg'),
  ('Leg Press (ขารวม/ก้น)', 'Legs', 'kg'),
  ('Leg Extension (หน้าขา)', 'Legs', 'pin'),
  ('Lying Leg Curl (หลังขา)', 'Legs', 'pin'),
  ('Calf Raises (น่อง)', 'Legs', 'kg'),
  ('Ab Crunch Machine (หน้าท้อง)', 'Core', 'pin'),
  ('Incline Chest Press (เน้นอกบน)', 'Chest', 'pin'),
  ('Bicep Curl / Triceps Pressdown (สลับเล่น)', 'Arms', 'pin')
ON CONFLICT DO NOTHING;
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
