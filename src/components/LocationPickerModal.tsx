'use client';

import React, { useState } from 'react';
import { X, MapPin, Plus, Check, Trash2, Info } from 'lucide-react';
import { GymLocation } from '@/types/workout';

interface LocationPickerModalProps {
  isOpen: boolean;
  locations: GymLocation[];
  selectedLocation: GymLocation;
  onClose: () => void;
  onSelectLocation: (loc: GymLocation) => void;
  onAddLocation: (newLoc: GymLocation) => void;
  onDeleteLocation: (locId: string) => void;
}

export default function LocationPickerModal({
  isOpen,
  locations,
  selectedLocation,
  onClose,
  onSelectLocation,
  onAddLocation,
  onDeleteLocation,
}: LocationPickerModalProps) {
  const [newLocName, setNewLocName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const newLoc: GymLocation = {
      id: `loc-${Date.now()}`,
      name: newLocName.trim(),
    };

    onAddLocation(newLoc);
    onSelectLocation(newLoc);
    setNewLocName('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-md bg-[#121721] rounded-t-3xl sm:rounded-3xl border border-[#1f2737] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">
              เลือกสถานที่เล่นวันนี้ (Gym Location)
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

        {/* Info Explainer */}
        <div className="p-3.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <p>
            แต่ละที่น้ำหนักแผ่นและอัตราทดรอกของ Machine ไม่เท่ากัน! เมื่อคุณเลือกสถานที่
            ระบบจะดึงประวัติ <strong>&ldquo;คราวก่อน&rdquo;</strong> ที่เคยเล่นของยิมนั้นๆ มาให้โดยเฉพาะ
          </p>
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {locations.map((loc) => {
            const isSelected = selectedLocation.id === loc.id;

            return (
              <div
                key={loc.id}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer active:scale-98 ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'bg-[#161d2a] hover:bg-[#1c2637] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      isSelected
                        ? 'bg-emerald-500 text-black'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{loc.name}</div>
                    {isSelected && (
                      <div className="text-[11px] text-emerald-400 font-medium">
                        ใช้งานอยู่ในปัจจุบัน
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    locations.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`ต้องการลบสถานที่ "${loc.name}" หรือไม่?`)) {
                            onDeleteLocation(loc.id);
                          }
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="ลบสถานที่นี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New Location */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-1.5 mt-2 transition"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มสถานที่ใหม่ (เช่น Jetts พระราม 9, Fitness First)
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="pt-2 space-y-2">
              <input
                type="text"
                required
                autoFocus
                placeholder="พิมพ์ชื่อสถานที่ (เช่น Jetts, คอนโด A)..."
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#161d2a] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold"
                >
                  บันทึก
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
