'use client';

import React, { useState } from 'react';
import { Search, Plus, Dumbbell, Layers } from 'lucide-react';
import { Exercise, MuscleCategory, UnitType } from '@/types/workout';
import Sheet from './Sheet';

interface AddExerciseModalProps {
  isOpen: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  onCreateCustomExercise: (exercise: Exercise) => void;
}

const CATEGORIES: MuscleCategory[] = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
];

const CATEGORY_NAMES_TH: Record<MuscleCategory, string> = {
  All: 'ทั้งหมด',
  Chest: 'อก',
  Back: 'หลัง',
  Legs: 'ขา',
  Shoulders: 'ไหล่',
  Arms: 'แขน',
  Core: 'ท้อง',
};

export default function AddExerciseModal({
  isOpen,
  exercises,
  onClose,
  onSelectExercise,
  onCreateCustomExercise,
}: AddExerciseModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<MuscleCategory>('All');
  const [selectedUnit, setSelectedUnit] = useState<'all' | 'pin' | 'kg'>('all');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<MuscleCategory>('Chest');
  const [customUnit, setCustomUnit] = useState<UnitType>('pin');

  if (!isOpen) return null;

  const searchTokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const filteredExercises = exercises.filter((ex) => {
    // 1. Muscle Category
    if (selectedCategory !== 'All' && ex.category !== selectedCategory) {
      return false;
    }

    // 2. Equipment / Unit Filter
    if (selectedUnit === 'pin' && ex.unit_type !== 'pin') return false;
    if (selectedUnit === 'kg' && ex.unit_type !== 'kg' && ex.unit_type !== 'bodyweight') return false;

    // 3. Multi-token smart search
    if (searchTokens.length === 0) return true;

    const categoryTh = CATEGORY_NAMES_TH[ex.category] || '';
    const unitKeywords =
      ex.unit_type === 'pin'
        ? 'แผ่น machine เครื่อง pin stack'
        : 'กิโล kg ดัมเบล dumbbell บาร์เบล barbell ฟรีเวท freeweight weight plate';
    const searchableText = `${ex.name} ${ex.category} ${categoryTh} ${ex.unit_type} ${unitKeywords}`.toLowerCase();

    return searchTokens.every((token) => searchableText.includes(token));
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      unit_type: customUnit,
      custom: true,
    };
    onCreateCustomExercise(newEx);
    onSelectExercise(newEx);
    setCustomName('');
    setShowCreateForm(false);
    onClose();
  };

  const handleStartCreateWithSearch = () => {
    setCustomName(search.trim());
    if (selectedCategory !== 'All') {
      setCustomCategory(selectedCategory);
    }
    if (selectedUnit === 'pin' || selectedUnit === 'kg') {
      setCustomUnit(selectedUnit);
    }
    setShowCreateForm(true);
  };

  return (
    <Sheet title={showCreateForm ? 'สร้างท่าใหม่' : 'เลือกท่าเล่น'} onClose={onClose}>
        {/* Search & Filter Bar */}
        {!showCreateForm && (
        <div className="sticky top-0 z-10 bg-paper px-4 pt-3 pb-2.5 space-y-2 border-b border-rule">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อท่า, ส่วนกล้ามเนื้อ, แผ่น, kg..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-paper border border-rule rounded-md text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-well text-mute hover:text-ink text-xs"
                title="ล้างคำค้นหา"
                aria-label="ล้างคำค้นหา"
              >
                ✕
              </button>
            )}
          </div>

          {/* Muscle Category Filter Chips */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-ink text-paper font-medium'
                    : 'text-mute hover:bg-well'
                }`}
              >
                {CATEGORY_NAMES_TH[cat]}
              </button>
            ))}
          </div>

          {/* Equipment / Unit Sub-filter & Result count */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedUnit('all')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedUnit === 'all'
                    ? 'bg-well text-ink font-semibold'
                    : 'text-mute hover:text-ink'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setSelectedUnit('pin')}
                className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                  selectedUnit === 'pin'
                    ? 'bg-well text-plate-blue font-semibold'
                    : 'text-mute hover:text-ink'
                }`}
              >
                <Layers className="w-3 h-3" />
                เครื่อง (แผ่น)
              </button>
              <button
                type="button"
                onClick={() => setSelectedUnit('kg')}
                className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                  selectedUnit === 'kg'
                    ? 'bg-well text-plate-blue font-semibold'
                    : 'text-mute hover:text-ink'
                }`}
              >
                <Dumbbell className="w-3 h-3" />
                ฟรีเวท (kg)
              </button>
            </div>

            <span className="text-faint text-[11px]">
              {filteredExercises.length} / {exercises.length} ท่า
            </span>
          </div>
        </div>
        )}

        {/* Exercises List */}
        <div>
          {!showCreateForm ? (
            <>
              {filteredExercises.length === 0 ? (
                <div className="px-4 py-10 text-center space-y-3">
                  <div className="text-mute text-sm">
                    ไม่พบท่าที่ตรงกับ <span className="text-ink font-semibold">&ldquo;{search}&rdquo;</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="px-3 py-1.5 rounded-md border border-rule text-xs text-mute hover:text-ink"
                      >
                        ล้างคำค้นหา
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartCreateWithSearch}
                      className="px-3.5 py-1.5 rounded-md bg-plate-blue text-white text-xs font-semibold hover:bg-plate-blue-dark inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      สร้างท่า {search.trim() ? `"${search.trim()}"` : 'ใหม่'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-rule">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        onSelectExercise(ex);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-well text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {ex.unit_type === 'pin' ? (
                          <Layers className="w-4 h-4 shrink-0 text-faint" />
                        ) : (
                          <Dumbbell className="w-4 h-4 shrink-0 text-faint" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-ink text-sm truncate">{ex.name}</div>
                          <div className="text-xs text-mute">
                            {CATEGORY_NAMES_TH[ex.category]}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-mute shrink-0">
                        {ex.unit_type === 'pin' ? 'แผ่น' : 'kg'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Button to open custom form */}
              <div className="px-4 py-3 border-t border-rule bg-paper">
                <button
                  type="button"
                  onClick={() => {
                    setCustomName('');
                    setShowCreateForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-plate-blue hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มท่าของฉันเอง
                </button>
              </div>
            </>
          ) : (
            /* Custom Exercise Form */
            <form onSubmit={handleCreateSubmit} className="px-5 py-4 space-y-4">

              <div>
                <label className="text-sm text-mute mb-1 block">ชื่อท่า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Machine Shoulder Press, Cable Fly"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-paper border border-rule rounded-md px-3 py-2 text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
                />
              </div>

              <div>
                <label className="text-sm text-mute mb-1 block">ส่วนกล้ามเนื้อ</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as MuscleCategory)}
                  className="w-full bg-paper border border-rule rounded-md px-3 py-2 text-ink text-sm focus:outline-none focus:border-plate-blue"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_NAMES_TH[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-mute mb-1 block">
                  หน่วยน้ำหนัก
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-well rounded-md">
                  <button
                    type="button"
                    onClick={() => setCustomUnit('pin')}
                    className={`py-2 px-3 rounded-md text-sm ${
                      customUnit === 'pin'
                        ? 'bg-ink text-paper font-medium'
                        : 'text-mute hover:text-ink'
                    }`}
                  >
                    แผ่นที่
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomUnit('kg')}
                    className={`py-2 px-3 rounded-md text-sm ${
                      customUnit === 'kg'
                        ? 'bg-ink text-paper font-medium'
                        : 'text-mute hover:text-ink'
                    }`}
                  >
                    กิโลกรัม
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 border border-rule bg-paper text-ink text-sm rounded-md hover:bg-well"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-plate-blue text-white text-sm font-semibold rounded-md hover:bg-plate-blue-dark"
                >
                  บันทึกและเลือกท่านี้
                </button>
              </div>
            </form>
          )}
        </div>
    </Sheet>
  );
}
