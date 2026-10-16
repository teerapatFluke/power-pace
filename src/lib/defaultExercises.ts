import { Exercise } from '@/types/workout';

export const DEFAULT_EXERCISES: Exercise[] = [
  // --- ตารางส่วนตัวของผู้ใช้ (Your Personalized Routine) ---
  // อก (Chest)
  { id: 'chest-press-machine', name: 'Chest Press Machine (อกกลาง)', category: 'Chest', unit_type: 'pin' },
  { id: 'incline-chest-press', name: 'Incline Chest Press (เน้นอกบน)', category: 'Chest', unit_type: 'pin' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press (อกบน)', category: 'Chest', unit_type: 'kg' },
  { id: 'db-bench-press', name: 'Dumbbell Bench Press (ดัมเบลอกราบ)', category: 'Chest', unit_type: 'kg' },
  { id: 'pec-deck-fly', name: 'Pec Deck / Chest Fly (เครื่องหนีบอก)', category: 'Chest', unit_type: 'pin' },

  // หลัง (Back)
  { id: 'lat-pulldown', name: 'Lat Pulldown (หลังปีก/กว้าง)', category: 'Back', unit_type: 'pin' },
  { id: 'mid-row-machine', name: 'Mid Row Machine (หลังสะบัก/หนา)', category: 'Back', unit_type: 'pin' },
  { id: 'seated-cable-row', name: 'Seated Cable Row (เคเบิลงัดหลัง)', category: 'Back', unit_type: 'pin' },
  { id: 'pull-ups', name: 'Pull-ups (โหนบาร์)', category: 'Back', unit_type: 'bodyweight' },
  { id: 'barbell-deadlift', name: 'Barbell Deadlift (บาร์เบลเดดลิฟต์)', category: 'Back', unit_type: 'kg' },

  // ไหล่ (Shoulders)
  { id: 'shoulder-press-machine', name: 'Shoulder Press Machine (ไหล่หน้า)', category: 'Shoulders', unit_type: 'pin' },
  { id: 'lateral-raise', name: 'Lateral Raise (ไหล่ข้าง)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly (ไหล่หลัง)', category: 'Shoulders', unit_type: 'pin' },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press (ดัมเบลดันไหล่)', category: 'Shoulders', unit_type: 'kg' },

  // แขน (Arms)
  { id: 'triceps-pressdown', name: 'Triceps Pressdown (หลังแขน)', category: 'Arms', unit_type: 'pin' },
  { id: 'bicep-curl', name: 'Bicep Curl (หน้าแขน)', category: 'Arms', unit_type: 'kg' },
  { id: 'hammer-curl', name: 'Hammer Curl (ลำแขน)', category: 'Arms', unit_type: 'kg' },
  { id: 'bicep-triceps-superset', name: 'Bicep Curl / Triceps Pressdown (สลับเล่น)', category: 'Arms', unit_type: 'pin' },

  // ขา (Legs)
  { id: 'leg-press', name: 'Leg Press (ขารวม/ก้น)', category: 'Legs', unit_type: 'kg' },
  { id: 'leg-extension', name: 'Leg Extension (หน้าขา)', category: 'Legs', unit_type: 'pin' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl (หลังขา)', category: 'Legs', unit_type: 'pin' },
  { id: 'calf-raises', name: 'Calf Raises (น่อง)', category: 'Legs', unit_type: 'kg' },
  { id: 'barbell-squat', name: 'Barbell Squat (บาร์เบลสควอท)', category: 'Legs', unit_type: 'kg' },
  { id: 'rdl', name: 'Romanian Deadlift (RDL ขาหลัง/ก้น)', category: 'Legs', unit_type: 'kg' },

  // ท้อง / แกนกลาง (Core)
  { id: 'ab-crunch-machine', name: 'Ab Crunch Machine (หน้าท้อง)', category: 'Core', unit_type: 'pin' },
];
