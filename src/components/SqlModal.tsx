'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink } from 'lucide-react';

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

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#121721] rounded-3xl border border-[#1f2737] shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">
              สร้างตารางบน Supabase (SQL Schema)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-gray-300 space-y-2">
          <p>
            นำโค้ด SQL ด้านล่างไปรันใน{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold inline-flex items-center gap-0.5 hover:underline"
            >
              Supabase Dashboard <ExternalLink className="w-3 h-3" />
            </a>{' '}
            &gt; <strong>SQL Editor</strong> &gt; <strong>New query</strong> &gt; วางโค้ดและกด <strong>Run</strong>
          </p>
        </div>

        {/* Code Block */}
        <div className="relative flex-1 bg-black/60 rounded-xl p-3 border border-white/10 overflow-y-auto no-scrollbar font-mono text-[11px] text-gray-300">
          <button
            type="button"
            onClick={handleCopy}
            className="sticky top-2 right-2 float-right px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 shadow transition"
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

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
}
