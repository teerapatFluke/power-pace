import { Exercise } from '@/types/workout';

export const DEFAULT_EXERCISES: Exercise[] = [
  // ==========================================
  // อก (CHEST)
  // ==========================================
  { id: 'chest-press-machine', name: 'Chest Press Machine (อกกลางเครื่อง)', category: 'Chest', unit_type: 'pin' },
  { id: 'incline-chest-press', name: 'Incline Chest Press (อกบนเครื่อง)', category: 'Chest', unit_type: 'pin' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press (ดัมเบลอกบน)', category: 'Chest', unit_type: 'kg' },
  { id: 'db-bench-press', name: 'Dumbbell Bench Press (ดัมเบลอกราบ)', category: 'Chest', unit_type: 'kg' },
  { id: 'pec-deck-fly', name: 'Pec Deck / Chest Fly (เครื่องหนีบอก)', category: 'Chest', unit_type: 'pin' },
  { id: 'barbell-bench-press', name: 'Barbell Bench Press (บาร์เบลอกราบ)', category: 'Chest', unit_type: 'kg' },
  { id: 'incline-bb-press', name: 'Incline Barbell Press (บาร์เบลอกบน)', category: 'Chest', unit_type: 'kg' },
  { id: 'decline-db-press', name: 'Decline Dumbbell Press (ดัมเบลอกล่าง)', category: 'Chest', unit_type: 'kg' },
  { id: 'cable-crossover', name: 'Cable Crossover / Fly (เคเบิลหนีบอก)', category: 'Chest', unit_type: 'pin' },
  { id: 'low-to-high-cable-fly', name: 'Low to High Cable Fly (เคเบิลเสยอกบน)', category: 'Chest', unit_type: 'pin' },
  { id: 'chest-dips', name: 'Chest Dips (ดิปส์อก)', category: 'Chest', unit_type: 'bodyweight' },
  { id: 'push-ups', name: 'Push-ups (วิดพื้น)', category: 'Chest', unit_type: 'bodyweight' },

  // ==========================================
  // หลัง (BACK)
  // ==========================================
  { id: 'lat-pulldown', name: 'Lat Pulldown (ดึงปีกกว้างเครื่อง)', category: 'Back', unit_type: 'pin' },
  { id: 'mid-row-machine', name: 'Mid Row Machine (ดึงสะบักเครื่อง)', category: 'Back', unit_type: 'pin' },
  { id: 'seated-cable-row', name: 'Seated Cable Row (เคเบิลงัดหลัง)', category: 'Back', unit_type: 'pin' },
  { id: 'pull-ups', name: 'Pull-ups (โหนบาร์)', category: 'Back', unit_type: 'bodyweight' },
  { id: 'barbell-deadlift', name: 'Barbell Deadlift (บาร์เบลเดดลิฟต์)', category: 'Back', unit_type: 'kg' },
  { id: 'close-grip-pulldown', name: 'Close-Grip Lat Pulldown (ดึงปีกจับแคบ)', category: 'Back', unit_type: 'pin' },
  { id: 'bb-bent-over-row', name: 'Barbell Bent Over Row (บาร์เบลโรว์)', category: 'Back', unit_type: 'kg' },
  { id: 'single-arm-db-row', name: 'Single-Arm Dumbbell Row (ดัมเบลโรว์)', category: 'Back', unit_type: 'kg' },
  { id: 't-bar-row', name: 'T-Bar Row (ทีบาร์โรว์)', category: 'Back', unit_type: 'kg' },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Cable Pulldown (เคเบิลกดปีก)', category: 'Back', unit_type: 'pin' },
  { id: 'assisted-pull-up', name: 'Assisted Pull-up (เครื่องช่วยโหนบาร์)', category: 'Back', unit_type: 'pin' },
  { id: 'hyperextension', name: 'Back Extension / Hyperextension (หลังล่าง)', category: 'Back', unit_type: 'bodyweight' },

  // ==========================================
  // ไหล่ (SHOULDERS)
  // ==========================================
  { id: 'shoulder-press-machine', name: 'Shoulder Press Machine (เครื่องดันไหล่)', category: 'Shoulders', unit_type: 'pin' },
  { id: 'lateral-raise', name: 'Dumbbell Lateral Raise (ดัมเบลยกไหล่ข้าง)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly Machine (เครื่องไหล่หลัง)', category: 'Shoulders', unit_type: 'pin' },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press (ดัมเบลดันไหล่)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'overhead-press', name: 'Overhead Press / OHP (บาร์เบลดันไหล่)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise (เคเบิลยกไหล่ข้าง)', category: 'Shoulders', unit_type: 'pin' },
  { id: 'face-pull', name: 'Face Pull (เคเบิลดึงหน้าไหล่หลัง)', category: 'Shoulders', unit_type: 'pin' },
  { id: 'front-raise', name: 'Dumbbell Front Raise (ยกไหล่หน้า)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'reverse-db-fly', name: 'Bent-Over Dumbbell Fly (ดัมเบลไหล่หลัง)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'dumbbell-shrug', name: 'Dumbbell Shrug (ดัมเบลยักไหล่/ทราพีเซียส)', category: 'Shoulders', unit_type: 'kg' },
  { id: 'barbell-shrug', name: 'Barbell Shrug (บาร์เบลยักไหล่)', category: 'Shoulders', unit_type: 'kg' },

  // ==========================================
  // แขน (ARMS - Biceps & Triceps)
  // ==========================================
  { id: 'triceps-pressdown', name: 'Triceps Pressdown (เคเบิลกดหลังแขน)', category: 'Arms', unit_type: 'pin' },
  { id: 'bicep-curl', name: 'Dumbbell Bicep Curl (ดัมเบลหน้าแขน)', category: 'Arms', unit_type: 'kg' },
  { id: 'hammer-curl', name: 'Hammer Curl (ดัมเบลแฮมเมอร์)', category: 'Arms', unit_type: 'kg' },
  { id: 'bicep-triceps-superset', name: 'Bicep Curl / Triceps Pressdown (สลับเล่น)', category: 'Arms', unit_type: 'pin' },
  { id: 'bb-bicep-curl', name: 'Barbell / EZ-Bar Curl (บาร์เบลหน้าแขน)', category: 'Arms', unit_type: 'kg' },
  { id: 'incline-db-curl', name: 'Incline Dumbbell Curl (หน้าแขนเบาะเอียง)', category: 'Arms', unit_type: 'kg' },
  { id: 'preacher-curl', name: 'Preacher Curl (พรีเชอร์เคิร์ลแท่นวาง)', category: 'Arms', unit_type: 'kg' },
  { id: 'cable-bicep-curl', name: 'Cable Bicep Curl (เคเบิลหน้าแขน)', category: 'Arms', unit_type: 'pin' },
  { id: 'triceps-rope-pushdown', name: 'Triceps Rope Pushdown (เชือกกดหลังแขน)', category: 'Arms', unit_type: 'pin' },
  { id: 'skull-crusher', name: 'Skull Crusher / Lying Triceps Extension (นอนดันหลังแขน)', category: 'Arms', unit_type: 'kg' },
  { id: 'overhead-triceps-ext', name: 'Overhead Cable Triceps Extension (เคเบิลข้ามหัว)', category: 'Arms', unit_type: 'pin' },
  { id: 'triceps-dips', name: 'Triceps Bench Dips (ดิปส์หลังแขน)', category: 'Arms', unit_type: 'bodyweight' },

  // ==========================================
  // ขาและก้น (LEGS & GLUTES)
  // ==========================================
  { id: 'leg-press', name: 'Leg Press Machine (เครื่องเลกเพรส)', category: 'Legs', unit_type: 'kg' },
  { id: 'leg-extension', name: 'Leg Extension (เครื่องเตะหน้าขา)', category: 'Legs', unit_type: 'pin' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl (เครื่องนอนพับขา)', category: 'Legs', unit_type: 'pin' },
  { id: 'calf-raises', name: 'Calf Raises (เขย่งน่อง)', category: 'Legs', unit_type: 'kg' },
  { id: 'barbell-squat', name: 'Barbell Back Squat (บาร์เบลสควอท)', category: 'Legs', unit_type: 'kg' },
  { id: 'rdl', name: 'Romanian Deadlift / RDL (ขาหลัง/ก้น)', category: 'Legs', unit_type: 'kg' },
  { id: 'hack-squat', name: 'Hack Squat (เครื่องแฮ็คสควอท)', category: 'Legs', unit_type: 'kg' },
  { id: 'smith-squat', name: 'Smith Machine Squat (สมิธสควอท)', category: 'Legs', unit_type: 'kg' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat (ดัมเบลขาเดี่ยว)', category: 'Legs', unit_type: 'kg' },
  { id: 'walking-lunges', name: 'Walking Lunges (ดัมเบลเดินก้าวขา)', category: 'Legs', unit_type: 'kg' },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl (เครื่องนั่งพับขา)', category: 'Legs', unit_type: 'pin' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust (บาร์เบลยกสะโพก/ก้น)', category: 'Legs', unit_type: 'kg' },
  { id: 'abductor-machine', name: 'Hip Abductor Machine (เครื่องอ้าขาก้นข้าง)', category: 'Legs', unit_type: 'pin' },
  { id: 'adductor-machine', name: 'Hip Adductor Machine (เครื่องหุบขาหนีบ)', category: 'Legs', unit_type: 'pin' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise (เครื่องนั่งเขย่งน่อง)', category: 'Legs', unit_type: 'kg' },

  // ==========================================
  // แกนกลาง / ท้อง (CORE / ABS)
  // ==========================================
  { id: 'ab-crunch-machine', name: 'Ab Crunch Machine (เครื่องซิทอัพหน้าท้อง)', category: 'Core', unit_type: 'pin' },
  { id: 'sit-up', name: 'Sit-up / Crunches (ซิทอัพหน้าท้อง)', category: 'Core', unit_type: 'bodyweight' },
  { id: 'decline-sit-up', name: 'Decline Sit-up (ซิทอัพม้านั่งลาดเอียง)', category: 'Core', unit_type: 'bodyweight' },
  { id: 'cable-crunch', name: 'Cable Kneeling Crunch (เคเบิลคุกเข่าซิทอัพ)', category: 'Core', unit_type: 'pin' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise (โหนบาร์ยกขา)', category: 'Core', unit_type: 'bodyweight' },
  { id: 'plank', name: 'Plank (แพลงก์จับเวลา)', category: 'Core', unit_type: 'bodyweight' },
  { id: 'russian-twist', name: 'Russian Twist (รัสเซียนทวิสต์บิดเอว)', category: 'Core', unit_type: 'kg' },
  { id: 'cable-woodchopper', name: 'Cable Woodchopper (เคเบิลบิดเอว)', category: 'Core', unit_type: 'pin' },
];
