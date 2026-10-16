'use client';

import React, { useState } from 'react';
import { X, Search, Plus, Dumbbell, Layers } from 'lucide-react';
import { Exercise, MuscleCategory, UnitType } from '@/types/workout';

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
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<MuscleCategory>('Chest');
  const [customUnit, setCustomUnit] = useState<UnitType>('pin');

  if (!isOpen) return null;

  const filteredExercises = exercises.filter((ex) => {
    const matchesCategory =
      selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-lg bg-[#121721] rounded-t-3xl sm:rounded-3xl border border-[#1f2737] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>🏋️ เลือกท่าเล่น</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Custom Toggle */}
        <div className="p-4 space-y-3 bg-[#0d1017]/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อท่าเล่น (เช่น Lat pulldown, อก, สควอท)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151c28] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Muscle Category Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-[#18202f] text-gray-400 hover:text-white'
                }`}
              >
                {CATEGORY_NAMES_TH[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {!showCreateForm ? (
            <>
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  ไม่พบท่าที่ค้นหา
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      onSelectExercise(ex);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161d2a] hover:bg-[#1c2637] active:scale-[0.98] border border-white/5 transition text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-800 text-emerald-400">
                        {ex.unit_type === 'pin' ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <Dumbbell className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{ex.name}</div>
                        <div className="text-xs text-gray-400">
                          {CATEGORY_NAMES_TH[ex.category]}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                        ex.unit_type === 'pin'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ex.unit_type === 'pin' ? 'แผ่น (Pin)' : 'กิโล (kg)'}
                    </span>
                  </button>
                ))
              )}

              {/* Button to open custom form */}
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 rounded-xl border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-1.5 mt-3 transition"
              >
                <Plus className="w-4 h-4" />
                + เพิ่มท่าเล่นของฉันเอง (Custom Exercise)
              </button>
            </>
          ) : (
            /* Custom Exercise Form */
            <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
              <div className="text-sm font-bold text-white mb-2">
                สร้างท่าออกกำลังกายใหม่
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">ชื่อท่า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Machine Shoulder Press, Cable Fly"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#161d2a] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">ส่วนกล้ามเนื้อ</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as MuscleCategory)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#161d2a] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_NAMES_TH[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  หน่วยเริ่มต้นในการนับน้ำหนัก
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomUnit('pin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      customUnit === 'pin'
                        ? 'bg-emerald-500 text-black border-emerald-500'
                        : 'bg-[#161d2a] text-gray-300 border-white/5'
                    }`}
                  >
                    แผ่นที่ (Pin Number)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomUnit('kg')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      customUnit === 'kg'
                        ? 'bg-emerald-500 text-black border-emerald-500'
                        : 'bg-[#161d2a] text-gray-300 border-white/5'
                    }`}
                  >
                    กิโลกรัม (kg)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition"
                >
                  บันทึกและเลือกท่านี้
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
