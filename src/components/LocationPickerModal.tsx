'use client';

import React, { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { GymLocation } from '@/types/workout';
import Sheet from './Sheet';

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
  const [addError, setAddError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const canDelete = locations.length > 1;

  const resetForm = () => {
    setNewLocName('');
    setAddError('');
    setIsAdding(false);
  };

  const handleClose = () => {
    resetForm();
    setConfirmDeleteId(null);
    onClose();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLocName.trim();
    if (!name) return;

    if (locations.some((l) => l.name.trim().toLowerCase() === name.toLowerCase())) {
      setAddError('มีสถานที่ชื่อนี้อยู่แล้ว');
      return;
    }

    const newLoc: GymLocation = {
      id: `loc-${Date.now()}`,
      name,
    };

    onAddLocation(newLoc);
    onSelectLocation(newLoc);
    resetForm();
  };

  const handleConfirmDelete = (loc: GymLocation) => {
    onDeleteLocation(loc.id);
    setConfirmDeleteId(null);
  };

  return (
    <Sheet
      title="เลือกยิมวันนี้"
      description="แต่ละที่ใช้น้ำหนักแผ่นและรอกไม่เท่ากัน ค่าครั้งก่อนจะดึงจากยิมที่เลือกเท่านั้น"
      onClose={handleClose}
      size="md"
    >
      <ul className="divide-y divide-rule">
        {locations.map((loc) => {
          const isSelected = selectedLocation.id === loc.id;
          const isConfirming = confirmDeleteId === loc.id;

          if (isConfirming) {
            return (
              <li key={loc.id} className="px-5 py-3 bg-plate-red/[0.06]">
                <p className="text-sm text-ink">
                  ลบ <span className="font-semibold">{loc.name}</span> ออกจากรายการ?
                </p>
                <p className="text-xs text-mute mt-0.5">
                  {isSelected
                    ? 'ยิมนี้ใช้อยู่ตอนนี้ ระบบจะสลับไปยิมแรกในรายการ ประวัติที่บันทึกไว้ยังอยู่ครบ'
                    : 'ประวัติที่บันทึกไว้ยังอยู่ครบ'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2 rounded-md border border-rule bg-paper text-sm text-ink hover:bg-well"
                  >
                    ไม่ลบ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(loc)}
                    className="flex-1 py-2 rounded-md bg-plate-red text-white text-sm font-semibold hover:bg-plate-red/90"
                  >
                    ลบสถานที่
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li key={loc.id} className="flex items-stretch">
              <button
                type="button"
                onClick={() => {
                  onSelectLocation(loc);
                  handleClose();
                }}
                aria-current={isSelected ? 'true' : undefined}
                className="flex-1 min-w-0 flex items-center gap-3 pl-5 pr-2 py-3.5 text-left hover:bg-well transition-colors"
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-plate-blue text-white' : 'border-2 border-rule'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate ${
                      isSelected ? 'font-semibold text-ink' : 'text-ink'
                    }`}
                  >
                    {loc.name}
                  </span>
                  {isSelected && (
                    <span className="block text-xs text-mute">ใช้อยู่ตอนนี้</span>
                  )}
                </span>
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(loc.id)}
                  className="px-5 text-faint hover:text-plate-red hover:bg-plate-red/10 transition-colors"
                  aria-label={`ลบ ${loc.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="px-5 py-4 border-t border-rule">
        {!isAdding ? (
          <button
            type="button"
            onClick={() => {
              setConfirmDeleteId(null);
              setIsAdding(true);
            }}
            className="w-full py-3 rounded-md border border-dashed border-faint text-sm font-medium text-mute hover:text-ink hover:border-ink flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสถานที่
          </button>
        ) : (
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-mute">ชื่อสถานที่</span>
              <input
                type="text"
                required
                autoFocus
                placeholder="เช่น Jetts พระราม 9"
                value={newLocName}
                onChange={(e) => {
                  setNewLocName(e.target.value);
                  setAddError('');
                }}
                aria-invalid={Boolean(addError)}
                className={`mt-1 w-full bg-paper border rounded-md px-3 py-2.5 text-ink placeholder:text-faint focus:outline-none ${
                  addError ? 'border-plate-red' : 'border-rule focus:border-plate-blue'
                }`}
              />
              {addError && <span className="mt-1 block text-xs text-plate-red">{addError}</span>}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 border border-rule bg-paper text-ink text-sm rounded-md hover:bg-well"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-plate-blue text-white text-sm font-semibold rounded-md hover:bg-plate-blue-dark"
              >
                เพิ่มและใช้ที่นี่
              </button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}
