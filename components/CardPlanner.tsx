import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlannerSlot } from '../types';
import { PlannedCardEditor } from './PlannedCardEditor';
import type { Database as SqlJsDatabase } from 'sql.js';
import { useToast } from '../context/ToastContext';

interface CardPlannerProps {
  plannerSlots: PlannerSlot[];
  setPlannerSlots: React.Dispatch<React.SetStateAction<PlannerSlot[]>>;
  onSave: () => void;
  isSaving: boolean;
  dbInstance: SqlJsDatabase | null;
  onOpenLoadModal: (slotId: number) => void;
}

const DEFAULT_SLOT_NAME = (id: number) => `Slot ${id}`;

export const CardPlanner: React.FC<CardPlannerProps> = ({
  plannerSlots,
  setPlannerSlots,
  onSave,
  isSaving,
  dbInstance,
  onOpenLoadModal,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<number>(plannerSlots[0]?.slotId || 1);
  const [editingName, setEditingName] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const selectedSlot = plannerSlots.find((s) => s.slotId === selectedSlotId);

  useEffect(() => {
    if (editingName !== null && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (!plannerSlots.find((s) => s.slotId === selectedSlotId) && plannerSlots.length > 0) {
      setSelectedSlotId(plannerSlots[0].slotId);
    }
  }, [plannerSlots, selectedSlotId]);

  const handleAddSlot = () => {
    const maxId = plannerSlots.reduce((max, s) => Math.max(max, s.slotId), 0);
    const newSlot: PlannerSlot = {
      slotId: maxId + 1,
      name: newSlotName.trim() || DEFAULT_SLOT_NAME(maxId + 1),
      cards: [],
    };
    setPlannerSlots((prev) => [...prev, newSlot]);
    setSelectedSlotId(newSlot.slotId);
    setShowAddSlot(false);
    setNewSlotName('');
    addToast(`Slot "${newSlot.name}" created!`, { type: 'success' });
  };

  const handleRemoveSlot = (slotId: number) => {
    if (plannerSlots.length <= 1) {
      addToast('Cannot remove the last slot.', { type: 'warning' });
      return;
    }
    const slot = plannerSlots.find((s) => s.slotId === slotId);
    if (window.confirm(`Delete slot "${slot?.name || DEFAULT_SLOT_NAME(slotId)}" and all its cards?`)) {
      setPlannerSlots((prev) => prev.filter((s) => s.slotId !== slotId));
      if (selectedSlotId === slotId) {
        const remaining = plannerSlots.filter((s) => s.slotId !== slotId);
        setSelectedSlotId(remaining[0]?.slotId || 1);
      }
      addToast('Slot deleted.', { type: 'info' });
    }
  };

  const handleRenameSlot = (slotId: number) => {
    if (!editNameValue.trim()) {
      setEditingName(null);
      return;
    }
    setPlannerSlots((prev) =>
      prev.map((s) => (s.slotId === slotId ? { ...s, name: editNameValue.trim() } : s))
    );
    setEditingName(null);
  };

  const handleMoveSlot = (slotId: number, direction: 'left' | 'right') => {
    setPlannerSlots((prev) => {
      const idx = prev.findIndex((s) => s.slotId === slotId);
      if (idx === -1) return prev;
      const newIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newSlots = [...prev];
      [newSlots[idx], newSlots[newIdx]] = [newSlots[newIdx], newSlots[idx]];
      return newSlots;
    });
  };

  if (!selectedSlot) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="card p-8 text-center">
          <i className="fas fa-inbox text-5xl text-[var(--clr-text-muted)] mb-4 block opacity-40" />
          <p className="text-lg font-bold text-[var(--clr-text)]">No slots available</p>
          <button onClick={() => setShowAddSlot(true)} className="btn-primary mt-4">Create a Slot</button>
        </div>
      </div>
    );
  }

  const totalCards = plannerSlots.reduce((sum, s) => sum + s.cards.length, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[var(--clr-text-accent)] tracking-tight">
            Card Planner
          </h2>
          {totalCards > 0 && (
            <span className="rounded-full bg-[var(--clr-primary)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--clr-accent)]">
              {totalCards} card{totalCards !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onSave} disabled={isSaving} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
            <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`} />
            {isSaving ? 'Saving...' : 'Save Planner'}
          </button>
        </div>
      </header>

      {/* Slot tabs */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-xl border border-[var(--clr-border)] bg-[var(--clr-bg-card)]/30 p-1">
        <AnimatePresence>
          {plannerSlots.map((slot, idx) => (
            <motion.div
              key={slot.slotId}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative flex shrink-0 items-center"
            >
              {/* Move left */}
              {idx > 0 && (
                <button
                  onClick={() => handleMoveSlot(slot.slotId, 'left')}
                  className="mr-0.5 rounded p-0.5 text-[var(--clr-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--clr-text)] transition-opacity"
                  title="Move left"
                >
                  <i className="fas fa-chevron-left text-[10px]" />
                </button>
              )}

              {/* Slot button */}
              {editingName === slot.slotId ? (
                <input
                  ref={nameInputRef}
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={() => handleRenameSlot(slot.slotId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSlot(slot.slotId);
                    if (e.key === 'Escape') setEditingName(null);
                  }}
                  className="w-28 rounded-md border border-[var(--clr-border-focus)] bg-[var(--clr-bg-card)] px-2 py-1.5 text-xs font-semibold text-[var(--clr-text)] outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <button
                  onClick={() => setSelectedSlotId(slot.slotId)}
                  onDoubleClick={() => {
                    setEditingName(slot.slotId);
                    setEditNameValue(slot.name || DEFAULT_SLOT_NAME(slot.slotId));
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all
                    ${selectedSlotId === slot.slotId
                      ? 'bg-[var(--clr-primary)]/20 text-[var(--clr-accent)] ring-1 ring-[var(--clr-primary)]/30'
                      : 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-primary)]/10 hover:text-[var(--clr-text)]'
                    }`}
                  title="Double-click to rename"
                >
                  {slot.name || DEFAULT_SLOT_NAME(slot.slotId)}
                  {slot.cards.length > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-60">{slot.cards.length}</span>
                  )}
                </button>
              )}

              {/* Remove */}
              {plannerSlots.length > 1 && (
                <button
                  onClick={() => handleRemoveSlot(slot.slotId)}
                  className="ml-0.5 rounded p-0.5 text-[var(--clr-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--clr-danger)] transition-opacity"
                  title="Delete slot"
                >
                  <i className="fas fa-times text-[10px]" />
                </button>
              )}

              {/* Move right */}
              {idx < plannerSlots.length - 1 && (
                <button
                  onClick={() => handleMoveSlot(slot.slotId, 'right')}
                  className="ml-0.5 rounded p-0.5 text-[var(--clr-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--clr-text)] transition-opacity"
                  title="Move right"
                >
                  <i className="fas fa-chevron-right text-[10px]" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add slot button */}
        {showAddSlot ? (
          <div className="flex shrink-0 items-center gap-1 px-1">
            <input
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
              placeholder="Slot name..."
              className="w-28 rounded-md border border-[var(--clr-border-focus)] bg-[var(--clr-bg-card)] px-2 py-1.5 text-xs text-[var(--clr-text)] outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSlot();
                if (e.key === 'Escape') setShowAddSlot(false);
              }}
            />
            <button onClick={handleAddSlot} className="rounded-md bg-[var(--clr-primary)]/20 px-2 py-1.5 text-xs font-bold text-[var(--clr-accent)] hover:bg-[var(--clr-primary)]/30">
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSlot(true)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-[var(--clr-text-muted)] hover:bg-[var(--clr-primary)]/10 hover:text-[var(--clr-text)] transition-colors"
          >
            <i className="fas fa-plus mr-1 text-[10px]" /> New Slot
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <PlannedCardEditor
          key={selectedSlot.slotId}
          slot={selectedSlot}
          setPlannerSlots={setPlannerSlots}
          dbInstance={dbInstance}
          onOpenLoadModal={onOpenLoadModal}
        />
      </div>
    </div>
  );
};
