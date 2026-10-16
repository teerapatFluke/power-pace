import { Exercise } from '@/types/workout';

export const DEFAULT_EXERCISES: Exercise[] = [
  // Machine / Pin
  { id: 'lat-pulldown', name: 'Lat Pulldown (ดึงหลัง)', category: 'Back', unit_type: 'pin' },
  { id: 'seated-cable-row', name: 'Seated Cable Row (เคเบิลงัดหลัง)', category: 'Back', unit_type: 'pin' },
  { id: 'chest-press-machine', name: 'Chest Press Machine (เครื่องดันอก)', category: 'Chest', unit_type: 'pin' },
  { id: 'pec-deck-fly', name: 'Pec Deck / Chest Fly (เครื่องหนีบอก)', category: 'Chest', unit_type: 'pin' },
  { id: 'leg-extension', name: 'Leg Extension (เตะขาหน้า)', category: 'Legs', unit_type: 'pin' },
  { id: 'leg-curl', name: 'Leg Curl (ดึงขาหลัง)', category: 'Legs', unit_type: 'pin' },
  { id: 'cable-triceps-pushdown', name: 'Cable Triceps Pushdown (แขนหลัง)', category: 'Arms', unit_type: 'pin' },
  { id: 'cable-biceps-curl', name: 'Cable Biceps Curl (แขนหน้าเคเบิล)', category: 'Arms', unit_type: 'pin' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise (ยกข้างเคเบิล)', category: 'Shoulders', unit_type: 'pin' },
  
  // Free Weight (kg)
  { id: 'db-bench-press', name: 'Dumbbell Bench Press (ดัมเบลอกราบ)', category: 'Chest', unit_type: 'kg' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press (ดัมเบลอกบน)', category: 'Chest', unit_type: 'kg' },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press (ดัมเบลดันไหล่)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raise (ดัมเบลยกข้าง)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'db-biceps-curl', name: 'Dumbbell Biceps Curl (ดัมเบลหน้าแขน)', category: 'Arms', unit_type: 'kg' },
  { id: 'db-hammer-curl', name: 'Hammer Curl (ดัมเบลค้อน)', category: 'Arms', unit_type: 'kg' },
  { id: 'barbell-bench-press', name: 'Barbell Bench Press (บาร์เบลอกราบ)', category: 'Chest', unit_type: 'kg' },
  { id: 'barbell-squat', name: 'Barbell Squat (บาร์เบลสควอท)', category: 'Legs', unit_type: 'kg' },
  { id: 'barbell-deadlift', name: 'Barbell Deadlift (บาร์เบลเดดลิฟต์)', category: 'Back', unit_type: 'kg' },
  { id: 'rdl', name: 'Romanian Deadlift (RDL ขาหลัง/ก้น)', category: 'Legs', unit_type: 'kg' },
  
  // Bodyweight
  { id: 'pull-ups', name: 'Pull-ups (โหนบาร์)', category: 'Back', unit_type: 'bodyweight' },
  { id: 'dips', name: 'Dips (ดริป)', category: 'Chest', unit_type: 'bodyweight' },
];
