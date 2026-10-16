export interface RoutinePreset {
  id: string;
  day: string;
  name: string;
  focus: string;
  exerciseIds: string[];
}

export const WORKOUT_ROUTINES: RoutinePreset[] = [
  {
    id: 'monday-push',
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
    id: 'tuesday-pull',
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
    id: 'wednesday-legs',
    day: 'พุธ',
    name: 'พุธ (Legs)',
    focus: 'ขารวม/ก้น, หน้าขา, หลังขา, น่อง, หน้าท้อง',
    exerciseIds: [
      'leg-press',
      'leg-extension',
      'lying-leg-curl',
      'calf-raises',
      'ab-crunch-machine',
    ],
  },
  {
    id: 'friday-upper',
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
    id: 'saturday-lower',
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
