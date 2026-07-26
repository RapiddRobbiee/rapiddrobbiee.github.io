import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlannerSlot, PlannedCard, PlannedSuperAttack, PlannedMiscSection, PlannerTemplate } from '../types';
import { FormInput, FormTextArea, FormSelect } from './FormControls';
import { ELEMENT_TYPE_OPTIONS, RARITY_TYPE_OPTIONS, generateLocalId } from '../constants';

import { TemplateManager } from './TemplateManager';
import * as templateService from '../services/templateService';
import type { Database as SqlJsDatabase } from 'sql.js';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../context/ToastContext';

interface PlannedCardEditorProps {
  slot: PlannerSlot;
  setPlannerSlots: React.Dispatch<React.SetStateAction<PlannerSlot[]>>;
  dbInstance: SqlJsDatabase | null;
  onOpenLoadModal: (slotId: number) => void;
}

const createNewPlannedCard = (): PlannedCard => ({
  plannerCardId: generateLocalId(),
  name: 'New Planned Card',
  title: '',
  element: 0,
  rarity: 5,
  hpBase: 18000,
  hpMax: 22000,
  atkBase: 16000,
  atkMax: 20000,
  defBase: 8000,
  defMax: 12000,
  cost: 58,
  leaderSkillText: '',
  passiveSkillText: '',
  superAttacks: [
    { id: generateLocalId(), name: 'Super Attack', text: '' },
    { id: generateLocalId(), name: 'Ultra Super Attack', text: '' },
  ],
  activeSkillName: '',
  activeSkillConditions: '',
  activeSkillText: '',
  categoryIds: [],
  linkSkillIds: [],
  miscSections: [],
});

export const PlannedCardEditor: React.FC<PlannedCardEditorProps> = ({
  slot,
  setPlannerSlots,
  dbInstance,
  onOpenLoadModal,
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLinkSkillId, setNewLinkSkillId] = useState('');
  const { addToast } = useToast();

  useEffect(() => { setSelectedCardIndex(0); }, [slot.slotId]);
  useEffect(() => {
    if (selectedCardIndex >= slot.cards.length && slot.cards.length > 0)
      setSelectedCardIndex(slot.cards.length - 1);
  }, [slot.cards, selectedCardIndex]);

  const card = slot.cards[selectedCardIndex];

  const updateCardInSlot = (updatedCard: PlannedCard, index: number) => {
    const newCards = [...slot.cards];
    newCards[index] = updatedCard;
    setPlannerSlots((prev) =>
      prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: newCards, lastUpdated: Date.now() } : s))
    );
  };

  const handleFieldChange = (field: keyof PlannedCard, value: any) => {
    if (!card) return;
    updateCardInSlot({ ...card, [field]: value }, selectedCardIndex);
  };

  const handleClearSlot = () => {
    if (window.confirm('Clear all cards from this slot?')) {
      setPlannerSlots((prev) =>
        prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: [], lastUpdated: Date.now() } : s))
      );
      logAnalyticsEvent('planner_slot_cleared', { slot_id: slot.slotId });
    }
  };

  const handleCreateNew = () => {
    const newCard = createNewPlannedCard();
    setPlannerSlots((prev) =>
      prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: [newCard], lastUpdated: Date.now() } : s))
    );
  };

  const handleAddCardForm = () => {
    const newCard = createNewPlannedCard();
    newCard.name = `Card Form ${slot.cards.length + 1}`;
    const newCards = [...slot.cards, newCard];
    setPlannerSlots((prev) =>
      prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: newCards, lastUpdated: Date.now() } : s))
    );
    setSelectedCardIndex(newCards.length - 1);
  };

  const handleRemoveCardForm = (idx: number) => {
    if (slot.cards.length <= 1) return;
    if (window.confirm(`Remove '${slot.cards[idx].name}'?`)) {
      const newCards = slot.cards.filter((_, i) => i !== idx);
      setPlannerSlots((prev) =>
        prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: newCards, lastUpdated: Date.now() } : s))
      );
    }
  };

  const handleDuplicateCard = () => {
    if (!card) return;
    const dup = JSON.parse(JSON.stringify(card)) as PlannedCard;
    dup.plannerCardId = generateLocalId();
    dup.name = `${card.name} (Copy)`;
    const newCards = [...slot.cards, dup];
    setPlannerSlots((prev) =>
      prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: newCards, lastUpdated: Date.now() } : s))
    );
    setSelectedCardIndex(newCards.length - 1);
    addToast('Card duplicated!', { type: 'success' });
  };

  // ── Super Attacks ──
  const handleSuperAttackChange = (i: number, field: 'name' | 'text', value: string) => {
    if (!card) return;
    const newSAs = [...card.superAttacks];
    newSAs[i] = { ...newSAs[i], [field]: value };
    updateCardInSlot({ ...card, superAttacks: newSAs }, selectedCardIndex);
  };
  const handleAddSuperAttack = () => {
    if (!card) return;
    updateCardInSlot({
      ...card,
      superAttacks: [...card.superAttacks, { id: generateLocalId(), name: `SA ${card.superAttacks.length + 1}`, text: '' }],
    }, selectedCardIndex);
  };
  const handleRemoveSuperAttack = (i: number) => {
    if (!card || card.superAttacks.length <= 1) return;
    updateCardInSlot({ ...card, superAttacks: card.superAttacks.filter((_, j) => j !== i) }, selectedCardIndex);
  };

  // ── Misc Sections ──
  const handleAddMisc = () => {
    if (!card) return;
    updateCardInSlot({
      ...card,
      miscSections: [...card.miscSections, { id: generateLocalId(), title: 'New Section', text: '' }],
    }, selectedCardIndex);
  };
  const handleMiscChange = (i: number, field: 'title' | 'text', value: string) => {
    if (!card) return;
    const newSections = [...card.miscSections];
    newSections[i] = { ...newSections[i], [field]: value };
    updateCardInSlot({ ...card, miscSections: newSections }, selectedCardIndex);
  };
  const handleRemoveMisc = (i: number) => {
    if (!card) return;
    updateCardInSlot({ ...card, miscSections: card.miscSections.filter((_, j) => j !== i) }, selectedCardIndex);
  };

  // ── Categories & Link Skills ──
  const handleAddCategory = () => {
    if (!card || !newCategoryId.trim()) return;
    const current = card.categoryIds || [];
    if (current.includes(newCategoryId.trim())) return;
    updateCardInSlot({ ...card, categoryIds: [...current, newCategoryId.trim()] }, selectedCardIndex);
    setNewCategoryId('');
  };
  const handleRemoveCategory = (id: string) => {
    if (!card) return;
    updateCardInSlot({ ...card, categoryIds: (card.categoryIds || []).filter((c) => c !== id) }, selectedCardIndex);
  };
  const handleAddLinkSkill = () => {
    if (!card || !newLinkSkillId.trim()) return;
    const current = card.linkSkillIds || [];
    if (current.includes(newLinkSkillId.trim())) return;
    updateCardInSlot({ ...card, linkSkillIds: [...current, newLinkSkillId.trim()] }, selectedCardIndex);
    setNewLinkSkillId('');
  };
  const handleRemoveLinkSkill = (id: string) => {
    if (!card) return;
    updateCardInSlot({ ...card, linkSkillIds: (card.linkSkillIds || []).filter((l) => l !== id) }, selectedCardIndex);
  };

  // ── Template ──
  const handleApplyTemplate = (template: PlannerTemplate) => {
    const data = templateService.applyPlannerTemplate(template);
    const newCard: PlannedCard = { ...data, plannerCardId: generateLocalId() } as PlannedCard;
    const newCards = [...slot.cards, newCard];
    setPlannerSlots((prev) =>
      prev.map((s) => (s.slotId === slot.slotId ? { ...s, cards: newCards, lastUpdated: Date.now() } : s))
    );
    setSelectedCardIndex(newCards.length - 1);
  };

  // ── Export card as text ──
  const handleExportCard = () => {
    if (!card) return;
    const lines: string[] = [];
    lines.push(`[${card.name}] ${card.title}`);
    if (card.leaderSkillText) { lines.push(''); lines.push(`Leader: ${card.leaderSkillText}`); }
    if (card.passiveSkillText) { lines.push(''); lines.push(`Passive: ${card.passiveSkillText}`); }
    card.superAttacks.forEach((sa) => { lines.push(''); lines.push(`${sa.name}: ${sa.text}`); });
    if (card.activeSkillText) { lines.push(''); lines.push(`Active [${card.activeSkillName}]: ${card.activeSkillText}`); }
    if (card.activeSkillConditions) lines.push(`Conditions: ${card.activeSkillConditions}`);
    card.miscSections.forEach((s) => { lines.push(''); lines.push(`[${s.title}]: ${s.text}`); });
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(
      () => addToast('Card copied to clipboard!', { type: 'success' }),
      () => addToast('Failed to copy.', { type: 'error' })
    );
  };

  // ── Empty state ──
  if (slot.cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="card rounded-2xl border-2 border-dashed border-[var(--clr-border)] p-10 max-w-md w-full">
          <i className="fas fa-pen-to-square text-5xl text-[var(--clr-text-muted)] mb-4 block opacity-50" />
          <h3 className="text-xl font-bold text-[var(--clr-text)]">Slot {slot.slotId} is Empty</h3>
          <p className="text-sm text-[var(--clr-text-muted)] mt-2 mb-6">
            Create a card from scratch, load from the database, or apply a template.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleCreateNew} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <i className="fas fa-plus" /> Create New Card
            </button>
            <button
              onClick={() => onOpenLoadModal(slot.slotId)}
              disabled={!dbInstance}
              className="btn-secondary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <i className="fas fa-database" /> Load from DB
            </button>
            <button onClick={() => setShowTemplateModal(true)} className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
              <i className="fas fa-layer-group" /> Apply Template
            </button>
          </div>
          {!dbInstance && (
            <p className="text-xs text-amber-400 mt-4">Load a .db file to enable DB imports.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 xl:flex-row">
      {/* Left: Card list sidebar */}
      <aside className="card flex min-h-0 shrink-0 flex-col overflow-hidden xl:w-64">
        <div className="flex items-center justify-between border-b border-[var(--clr-border)] px-3 py-3">
          <h3 className="text-sm font-bold text-[var(--clr-text)]">Cards</h3>
          <span className="rounded-full bg-[var(--clr-primary)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--clr-accent)]">
            {slot.cards.length}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence>
            {slot.cards.map((c, i) => (
              <motion.button
                key={c.plannerCardId}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setSelectedCardIndex(i)}
                className={`w-full rounded-lg border p-2.5 text-left transition-all
                  ${i === selectedCardIndex
                    ? 'border-[var(--clr-primary)] bg-[var(--clr-primary)]/15'
                    : 'border-transparent bg-transparent hover:border-[var(--clr-border-focus)]'
                  }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={`truncate text-sm font-bold ${i === selectedCardIndex ? 'text-[var(--clr-accent)]' : 'text-[var(--clr-text)]'}`}>
                    {c.name || `Card ${i + 1}`}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: ['#9ca3af','#6b7280','#eab308','#a855f7','#f59e0b','#ef4444'][Math.min(c.rarity, 5)] }}>
                    {['N','R','SR','SSR','UR','LR'][Math.min(c.rarity, 5)]}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--clr-text-muted)] truncate">
                  {['AGL','TEQ','INT','STR','PHY'][Math.min(c.element, 4)]}
                  {c.cost != null ? ` · Cost ${c.cost}` : ''}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--clr-border)] p-2">
          <button onClick={handleAddCardForm} className="btn-secondary flex items-center justify-center gap-1 px-2 py-2 text-xs">
            <i className="fas fa-plus text-[10px]" /> Add
          </button>
          <button onClick={() => setShowTemplateModal(true)} className="btn-secondary flex items-center justify-center gap-1 px-2 py-2 text-xs">
            <i className="fas fa-layer-group text-[10px]" /> Template
          </button>
          {card && (
            <>
              <button onClick={handleDuplicateCard} className="btn-secondary flex items-center justify-center gap-1 px-2 py-2 text-xs">
                <i className="fas fa-copy text-[10px]" /> Duplicate
              </button>
              <button onClick={handleClearSlot} className="btn-danger flex items-center justify-center gap-1 px-2 py-2 text-xs">
                <i className="fas fa-trash text-[10px]" /> Clear
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Right: Editor + Preview */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4">
        {card && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button onClick={handleExportCard} className="btn-secondary-sm flex items-center gap-1">
                  <i className="fas fa-copy" /> Copy Text
                </button>
                <button onClick={() => setShowTemplateModal(true)} className="btn-secondary-sm flex items-center gap-1">
                  <i className="fas fa-save" /> Save Template
                </button>
                {slot.cards.length > 1 && (
                  <button
                    onClick={() => handleRemoveCardForm(selectedCardIndex)}
                    className="btn-danger-sm flex items-center gap-1"
                  >
                    <i className="fas fa-trash" /> Delete
                  </button>
                )}
              </div>
              <span className="text-xs text-[var(--clr-text-muted)]">
                Editing card {selectedCardIndex + 1} of {slot.cards.length}
              </span>
            </div>

            {/* Basic Info */}
            <section className="card-inset rounded-xl p-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Basic Info</h4>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormInput label="Name" value={card.name} onChange={(v) => handleFieldChange('name', v)} />
                <FormInput label="Title" value={card.title} onChange={(v) => handleFieldChange('title', v)} />
                <FormSelect label="Rarity" value={card.rarity} onChange={(v) => handleFieldChange('rarity', Number(v))} options={RARITY_TYPE_OPTIONS} />
                <FormSelect label="Element" value={card.element} onChange={(v) => handleFieldChange('element', Number(v))} options={ELEMENT_TYPE_OPTIONS} />
                <FormInput label="Cost" type="number" value={card.cost?.toString() || ''} onChange={(v) => handleFieldChange('cost', v ? Number(v) : undefined)} />
              </div>
            </section>

            {/* Stats */}
            <section className="card-inset rounded-xl p-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Stats</h4>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                {(['hp', 'atk', 'def'] as const).map((stat) => (
                  <div key={stat} className="space-y-1">
                    <span className="text-[11px] font-bold uppercase text-[var(--clr-text-muted)]">{stat}</span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={card[`${stat}Base`] ?? ''}
                        onChange={(e) => handleFieldChange(`${stat}Base`, e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Base"
                        className="w-full text-xs py-1.5"
                      />
                      <input
                        type="number"
                        value={card[`${stat}Max`] ?? ''}
                        onChange={(e) => handleFieldChange(`${stat}Max`, e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max"
                        className="w-full text-xs py-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Leader Skill */}
            <section className="card-inset rounded-xl p-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Leader Skill</h4>
              <FormTextArea value={card.leaderSkillText} onChange={(v) => handleFieldChange('leaderSkillText', v)} rows={3} placeholder="Category Ki +3, HP, ATK & DEF +170%..." />
            </section>

            {/* Passive Skill */}
            <section className="card-inset rounded-xl p-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Passive Skill</h4>
              <FormTextArea value={card.passiveSkillText} onChange={(v) => handleFieldChange('passiveSkillText', v)} rows={8} placeholder="ATK & DEF +200%..." />
            </section>

            {/* Super Attacks */}
            <section className="card-inset rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)]">Super Attacks</h4>
                <button onClick={handleAddSuperAttack} className="btn-secondary-sm"><i className="fas fa-plus mr-1" /> Add</button>
              </div>
              <div className="space-y-3">
                {card.superAttacks.map((sa, i) => (
                  <div key={sa.id} className="relative rounded-lg border border-[var(--clr-border)] bg-[var(--clr-bg-main)]/20 p-3">
                    {card.superAttacks.length > 1 && (
                      <button onClick={() => handleRemoveSuperAttack(i)} className="absolute -top-2 -right-2 btn-danger-sm h-6 w-6 flex items-center justify-center rounded-full">
                        <i className="fas fa-times text-[10px]" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormInput label="SA Name" value={sa.name} onChange={(v) => handleSuperAttackChange(i, 'name', v)} />
                      <FormTextArea label="Effect" value={sa.text} onChange={(v) => handleSuperAttackChange(i, 'text', v)} rows={2} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Skill */}
            <section className="card-inset rounded-xl p-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Active Skill</h4>
              <FormInput label="Name" value={card.activeSkillName} onChange={(v) => handleFieldChange('activeSkillName', v)} />
              <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
                <FormTextArea label="Conditions" value={card.activeSkillConditions} onChange={(v) => handleFieldChange('activeSkillConditions', v)} rows={3} />
                <FormTextArea label="Effects" value={card.activeSkillText} onChange={(v) => handleFieldChange('activeSkillText', v)} rows={3} />
              </div>
            </section>

            {/* Categories & Link Skills */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <section className="card-inset rounded-xl p-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Categories</h4>
                <div className="flex gap-2 mb-2">
                  <input value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} placeholder="Category ID" className="flex-1 text-xs py-1.5"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                  <button onClick={handleAddCategory} className="btn-secondary-sm px-3">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(card.categoryIds || []).map((id) => (
                    <span key={id} className="skill-chip group relative pr-7">
                      {id}
                      <button onClick={() => handleRemoveCategory(id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-50 hover:opacity-100 hover:text-[var(--clr-danger)]">
                        <i className="fas fa-times text-[9px]" />
                      </button>
                    </span>
                  ))}
                  {(!card.categoryIds || card.categoryIds.length === 0) && (
                    <p className="text-xs text-[var(--clr-text-muted)]">No categories added.</p>
                  )}
                </div>
              </section>

              <section className="card-inset rounded-xl p-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)] mb-3">Link Skills</h4>
                <div className="flex gap-2 mb-2">
                  <input value={newLinkSkillId} onChange={(e) => setNewLinkSkillId(e.target.value)} placeholder="Link Skill ID" className="flex-1 text-xs py-1.5"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLinkSkill()} />
                  <button onClick={handleAddLinkSkill} className="btn-secondary-sm px-3">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(card.linkSkillIds || []).map((id) => (
                    <span key={id} className="skill-chip group relative pr-7">
                      {id}
                      <button onClick={() => handleRemoveLinkSkill(id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-50 hover:opacity-100 hover:text-[var(--clr-danger)]">
                        <i className="fas fa-times text-[9px]" />
                      </button>
                    </span>
                  ))}
                  {(!card.linkSkillIds || card.linkSkillIds.length === 0) && (
                    <p className="text-xs text-[var(--clr-text-muted)]">No link skills added.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Misc Sections */}
            <section className="card-inset rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--clr-text-accent)]">Extra Sections</h4>
                <button onClick={handleAddMisc} className="btn-secondary-sm"><i className="fas fa-plus mr-1" /> Add</button>
              </div>
              <div className="space-y-3">
                {card.miscSections.map((s, i) => (
                  <div key={s.id} className="relative rounded-lg border border-[var(--clr-border)] bg-[var(--clr-bg-main)]/20 p-3">
                    <button onClick={() => handleRemoveMisc(i)} className="absolute top-2 right-2 btn-danger-sm h-6 w-6 flex items-center justify-center rounded-full">
                      <i className="fas fa-times text-[10px]" />
                    </button>
                    <input
                      value={s.title} onChange={(e) => handleMiscChange(i, 'title', e.target.value)}
                      placeholder="Section Title"
                      className="text-sm font-bold text-[var(--clr-text-accent)] bg-transparent w-full focus:outline-none rounded px-2 py-1 mb-2 border-b-2 border-transparent focus:border-[var(--clr-border)]"
                    />
                    <FormTextArea value={s.text} onChange={(v) => handleMiscChange(i, 'text', v)} rows={4} />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <TemplateManager
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        currentCard={card}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  );
};
