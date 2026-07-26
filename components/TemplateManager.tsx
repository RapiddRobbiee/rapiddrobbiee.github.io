import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlannerTemplate, PlannedCard } from '../types';
import * as templateService from '../services/templateService';
import { useToast } from '../context/ToastContext';
import { generateLocalId } from '../constants';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCard?: PlannedCard | null;
  onApplyTemplate: (template: PlannerTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  currentCard,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<PlannerTemplate[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTemplates(templateService.getPlannerTemplates());
      setShowSaveForm(false);
      setConfirmDelete(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!saveName.trim() || !currentCard) return;
    templateService.savePlannerTemplate(currentCard, saveName.trim(), saveDescription.trim() || undefined);
    setTemplates(templateService.getPlannerTemplates());
    setSaveName('');
    setSaveDescription('');
    setShowSaveForm(false);
    addToast(`Template "${saveName.trim()}" saved!`, { type: 'success' });
  };

  const handleDelete = (id: string) => {
    templateService.deletePlannerTemplate(id);
    setTemplates(templateService.getPlannerTemplates());
    setConfirmDelete(null);
    addToast('Template deleted.', { type: 'info' });
  };

  const handleApply = (template: PlannerTemplate) => {
    onApplyTemplate(template);
    onClose();
    addToast(`Template "${template.name}" applied!`, { type: 'success' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="modal-card w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-[var(--clr-text)]">
            <i className="fas fa-layer-group mr-2 text-[var(--clr-primary)]" />
            Card Templates
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--clr-text-muted)] hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Save current card as template */}
          {currentCard && (
            <div className="rounded-lg border border-[var(--clr-border)] p-4">
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <i className="fas fa-plus" />
                  Save "{currentCard.name || 'current card'}" as Template
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Template name (e.g. LR Template)"
                    className="w-full"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Optional description"
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={!saveName.trim()}
                      className="btn-primary flex-1 py-2 text-sm disabled:opacity-50"
                    >
                      Save Template
                    </button>
                    <button
                      onClick={() => setShowSaveForm(false)}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Template list */}
          {templates.length === 0 ? (
            <div className="py-12 text-center text-[var(--clr-text-muted)]">
              <i className="fas fa-folder-open text-4xl mb-3 block opacity-40" />
              <p className="text-sm">No templates saved yet.</p>
              <p className="text-xs mt-1 opacity-60">
                Create a card in the planner, then save it as a template to reuse it.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((template) => (
                  <motion.div
                    key={template.id}
                    layout
                    className="group rounded-lg border border-[var(--clr-border)] bg-[var(--clr-bg-card)]/60 p-3 hover:border-[var(--clr-primary)]/40 transition-colors"
                  >
                    {confirmDelete === template.id ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-sm text-[var(--clr-danger)]">Delete this template?</span>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="btn-danger-sm px-3 py-1 text-xs"
                        >
                          Yes, delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="btn-secondary-sm px-3 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--clr-text)] truncate">
                            {template.name}
                          </p>
                          {template.description && (
                            <p className="text-xs text-[var(--clr-text-muted)] mt-0.5 truncate">
                              {template.description}
                            </p>
                          )}
                          <p className="text-[11px] text-[var(--clr-text-muted)] mt-1.5">
                            <i className="fas fa-star mr-1 text-[var(--clr-accent)]" />
                            {template.card.rarity ? ['N', 'R', 'SR', 'SSR', 'UR', 'LR'][template.card.rarity] || '?' : '?'}
                            {' · '}
                            <span className="opacity-70">
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => handleApply(template)}
                            className="rounded-lg p-2 text-[var(--clr-primary)] hover:bg-[var(--clr-primary)]/15 transition-colors"
                            title="Apply template"
                          >
                            <i className="fas fa-check text-sm" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(template.id)}
                            className="rounded-lg p-2 text-[var(--clr-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/10 transition-all"
                            title="Delete template"
                          >
                            <i className="fas fa-trash text-sm" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--clr-border)] text-xs text-[var(--clr-text-muted)] text-center">
          Templates are stored locally in your browser.
        </div>
      </motion.div>
    </div>
  );
};
