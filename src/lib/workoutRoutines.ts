export interface RoutinePreset {
  id: string;
  day: string;
  name: string;
  focus: string;
  exerciseIds: string[];
}

export const DAYS_OF_WEEK = [
  'จันทร์',
  'อังคาร',
  'พุธ',
  'พฤหัสบดี',
  'ศุกร์',
  'เสาร์',
  'อาทิตย์',
] as const;

// 1. Push / Pull / Legs (5 วัน)
export const PUSH_PULL_LEGS_ROUTINES: RoutinePreset[] = [
  {
    id: 'mon-push',
    day: 'จันทร์',
    name: 'จันทร์ (Push)',
    focus: 'อกกลาง, อกบน, ไหล่หน้า, ไหล่ข้าง, หลังแขน',
    exerciseIds: [
      'chest-press-machine',
      'incline-db-press',
      'shoulder-press-machine',
      'lateral-raise',
      'triceps-pressdown',
    ],
  },
  {
    id: 'tue-pull',
    day: 'อังคาร',
    name: 'อังคาร (Pull)',
    focus: 'หลังปีก, หลังสะบัก, ไหล่หลัง, หน้าแขน, ลำแขน',
    exerciseIds: [
      'lat-pulldown',
      'mid-row-machine',
      'rear-delt-fly',
      'bicep-curl',
      'hammer-curl',
    ],
  },
  {
    id: 'wed-legs',
    day: 'พุธ',
    name: 'พุธ (Legs)',
    focus: 'ขารวม/ก้น, หน้าขา, หลังขา, น่อง, หน้าท้อง',
    exerciseIds: [
      'leg-press',
      'leg-extension',
      'lying-leg-curl',
      'calf-raises',
      'sit-up',
    ],
  },
  {
    id: 'fri-upper',
    day: 'ศุกร์',
    name: 'ศุกร์ (Upper)',
    focus: 'อกบน, หลังปีก, ไหล่หน้า, หลังหนา, แขนสลับเล่น',
    exerciseIds: [
      'incline-chest-press',
      'lat-pulldown',
      'shoulder-press-machine',
      'mid-row-machine',
      'bicep-triceps-superset',
    ],
  },
  {
    id: 'sat-lower',
    day: 'เสาร์',
    name: 'เสาร์ (Lower)',
    focus: 'ขารวม/ก้น, หน้าขา, หลังขา, น่อง, ไหล่ข้างเก็บตก',
    exerciseIds: [
      'leg-press',
      'leg-extension',
      'lying-leg-curl',
      'calf-raises',
      'lateral-raise',
    ],
  },
];

// 2. Upper / Lower Split (4 วัน)
export const UPPER_LOWER_ROUTINES: RoutinePreset[] = [
  {
    id: 'upper-a',
    day: 'จันทร์',
    name: 'จันทร์ (Upper A - เน้นอก/หลัง)',
    focus: 'อกราบ, หลังปีก, ไหล่ข้าง, หน้าแขน, หลังแขน',
    exerciseIds: [
      'chest-press-machine',
      'lat-pulldown',
      'incline-db-press',
      'mid-row-machine',
      'lateral-raise',
      'triceps-pressdown',
    ],
  },
  {
    id: 'lower-a',
    day: 'อังคาร',
    name: 'อังคาร (Lower A - ขาหน้า/น่อง/ท้อง)',
    focus: 'สควอท/เลกเพรส, หน้าขา, หลังขา, น่อง, ซิทอัพ',
    exerciseIds: [
      'leg-press',
      'leg-extension',
      'lying-leg-curl',
      'calf-raises',
      'sit-up',
    ],
  },
  {
    id: 'upper-b',
    day: 'พฤหัสบดี',
    name: 'พฤหัสบดี (Upper B - เน้นไหล่/แขน)',
    focus: 'อกบน, หลังหนา, ไหล่หน้า, ไหล่หลัง, แขนสลับเล่น',
    exerciseIds: [
      'incline-chest-press',
      'mid-row-machine',
      'shoulder-press-machine',
      'rear-delt-fly',
      'bicep-curl',
      'triceps-pressdown',
    ],
  },
  {
    id: 'lower-b',
    day: 'ศุกร์',
    name: 'ศุกร์ (Lower B - ขาหลัง/ก้น/น่อง)',
    focus: 'ขาหลัง/ก้น, เลกเพรส, หน้าขา, น่อง, ท้อง',
    exerciseIds: [
      'leg-press',
      'lying-leg-curl',
      'leg-extension',
      'calf-raises',
      'ab-crunch-machine',
    ],
  },
];

// 3. Full Body Split (3 วัน)
export const FULL_BODY_ROUTINES: RoutinePreset[] = [
  {
    id: 'fb-a',
    day: 'จันทร์',
    name: 'จันทร์ (Full Body A)',
    focus: 'อก, หลัง, ขา, ไหล่, แขน',
    exerciseIds: [
      'chest-press-machine',
      'lat-pulldown',
      'leg-press',
      'shoulder-press-machine',
      'bicep-curl',
    ],
  },
  {
    id: 'fb-b',
    day: 'พุธ',
    name: 'พุธ (Full Body B)',
    focus: 'ขา, หลัง, อกบน, ไหล่ข้าง, ท้อง',
    exerciseIds: [
      'leg-extension',
      'mid-row-machine',
      'incline-db-press',
      'lateral-raise',
      'sit-up',
    ],
  },
  {
    id: 'fb-c',
    day: 'ศุกร์',
    name: 'ศุกร์ (Full Body C)',
    focus: 'อก, หลัง, ขาหลัง, แขนหน้า/หลัง, น่อง',
    exerciseIds: [
      'incline-chest-press',
      'lat-pulldown',
      'lying-leg-curl',
      'triceps-pressdown',
      'calf-raises',
    ],
  },
];

// 4. Bro Split (5 วัน - เล่นทีละส่วน)
export const BRO_SPLIT_ROUTINES: RoutinePreset[] = [
  {
    id: 'bro-chest',
    day: 'จันทร์',
    name: 'จันทร์ (Chest - อกเน้นๆ)',
    focus: 'อกกลาง, อกบน, อกราบ, เคเบิลหนีบอก',
    exerciseIds: [
      'chest-press-machine',
      'incline-chest-press',
      'incline-db-press',
      'triceps-pressdown',
    ],
  },
  {
    id: 'bro-back',
    day: 'อังคาร',
    name: 'อังคาร (Back - หลังปีก/หนา)',
    focus: 'ดึงหลังกว้าง, ดึงสะบักหนา, เคเบิลงัดหลัง',
    exerciseIds: [
      'lat-pulldown',
      'mid-row-machine',
      'bicep-curl',
      'hammer-curl',
    ],
  },
  {
    id: 'bro-shoulders',
    day: 'พุธ',
    name: 'พุธ (Shoulders & Abs - ไหล่ + ท้อง)',
    focus: 'ไหล่หน้า, ไหล่ข้าง, ไหล่หลัง, ซิทอัพหน้าท้อง',
    exerciseIds: [
      'shoulder-press-machine',
      'lateral-raise',
      'rear-delt-fly',
      'sit-up',
    ],
  },
  {
    id: 'bro-legs',
    day: 'พฤหัสบดี',
    name: 'พฤหัสบดี (Legs - ขาแน่นๆ)',
    focus: 'ขารวม/ก้น, เตะหน้าขา, ดึงขาหลัง, น่อง',
    exerciseIds: [
      'leg-press',
      'leg-extension',
      'lying-leg-curl',
      'calf-raises',
    ],
  },
  {
    id: 'bro-arms',
    day: 'ศุกร์',
    name: 'ศุกร์ (Arms - หน้าแขน/หลังแขน)',
    focus: 'หน้าแขนดัมเบล, แฮมเมอร์, เคเบิลหลังแขน, ซิทอัพ',
    exerciseIds: [
      'bicep-curl',
      'hammer-curl',
      'triceps-pressdown',
      'sit-up',
    ],
  },
];

// รายการโปรแกรมมาตรฐานให้ผู้ใช้เลือก
export interface ProgramTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  daysCount: number;
  routines: RoutinePreset[];
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    badge: 'ยอดนิยม 5 วัน',
    description: 'ผลัก / ดึง / ขา + Upper / Lower จัดสมดุลกล้ามเนื้อได้ดีที่สุด',
    daysCount: 5,
    routines: PUSH_PULL_LEGS_ROUTINES,
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    badge: '4 วัน/สัปดาห์',
    description: 'ท่อนบนสลับท่อนล่าง เหมาะสำหรับคนมีเวลา 4 วันต่อสัปดาห์',
    daysCount: 4,
    routines: UPPER_LOWER_ROUTINES,
  },
  {
    id: 'full-body',
    name: 'Full Body',
    badge: '3 วัน/สัปดาห์',
    description: 'เล่นทั่วร่างวันเว้นวัน เหมาะสำหรับคนเวลาน้อยหรือเริ่มต้นฝึก',
    daysCount: 3,
    routines: FULL_BODY_ROUTINES,
  },
  {
    id: 'bro-split',
    name: 'Bro Split (ทีละส่วน)',
    badge: 'คลาสสิก 5 วัน',
    description: 'โฟกัสกล้ามเนื้อวันละ 1 ส่วน (อก, หลัง, ไหล่, ขา, แขน)',
    daysCount: 5,
    routines: BRO_SPLIT_ROUTINES,
  },
];

// ค่าเริ่มต้นมาตรฐาน
export const WORKOUT_ROUTINES: RoutinePreset[] = PUSH_PULL_LEGS_ROUTINES;

/**
 * สลับวันฝึกระหว่าง 2 ตาราง (Swap Routine Days)
 * พร้อมอัปเดตชื่อตารางอัตโนมัติหากชื่อขึ้นต้นด้วยวันเดิม (เช่น "จันทร์ (Push)" -> "พุธ (Push)")
 */
export function swapRoutineDays(
  routines: RoutinePreset[],
  routineIdA: string,
  routineIdB: string
): RoutinePreset[] {
  const indexA = routines.findIndex((r) => r.id === routineIdA);
  const indexB = routines.findIndex((r) => r.id === routineIdB);
  if (indexA === -1 || indexB === -1 || indexA === indexB) return routines;

  const routineA = routines[indexA];
  const routineB = routines[indexB];

  const updateNameWithNewDay = (oldName: string, oldDay: string, newDay: string): string => {
    const patterns = [
      new RegExp(`^วัน${oldDay}\\s*`, 'i'),
      new RegExp(`^${oldDay}\\s*`, 'i'),
    ];
    for (const pattern of patterns) {
      if (pattern.test(oldName)) {
        return oldName.replace(pattern, (match) => {
          return match.startsWith('วัน') ? `วัน${newDay} ` : `${newDay} `;
        }).trim();
      }
    }
    return oldName;
  };

  const newNameA = updateNameWithNewDay(routineA.name, routineA.day, routineB.day);
  const newNameB = updateNameWithNewDay(routineB.name, routineB.day, routineA.day);

  const updatedA: RoutinePreset = {
    ...routineA,
    day: routineB.day,
    name: newNameA,
  };

  const updatedB: RoutinePreset = {
    ...routineB,
    day: routineA.day,
    name: newNameB,
  };

  const newRoutines = [...routines];
  newRoutines[indexA] = updatedB;
  newRoutines[indexB] = updatedA;

  return newRoutines;
}

