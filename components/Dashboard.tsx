import React from 'react';
import { CardForm, DokkanPatchState, DokkanID } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Copy, Trash2, Edit } from 'lucide-react';

interface DashboardProps {
  patchState: DokkanPatchState;
  addCardForm: () => void;
  duplicateCardForm: (index: number) => void;
  removeCardForm: (index: number, cardId: DokkanID) => void;
  onEditCard: (index: number) => void;
  anyOperationLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patchState,
  addCardForm,
  duplicateCardForm,
  removeCardForm,
  onEditCard,
  anyOperationLoading,
}) => {
  return (
    <div className="p-6 h-full overflow-y-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--clr-primary)] to-[var(--clr-secondary)] drop-shadow-md">
          Patch Canvas
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addCardForm}
          disabled={anyOperationLoading}
          className="btn-primary py-3 px-6 rounded-xl font-bold flex items-center shadow-lg hover:shadow-xl transition-all"
        >
          <PlusCircle className="mr-2" /> Add Character
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {patchState.cardForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="card relative group overflow-hidden border border-[var(--glass-border)] rounded-2xl hover:border-[var(--clr-primary)] transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              <div className="p-6 z-10 relative">
                <h3 className="text-2xl font-bold text-[var(--clr-text-accent)] mb-2 truncate">
                  {form.name || `Character ${index + 1}`}
                </h3>
                <p className="text-sm text-[var(--clr-text-muted)] mb-6">
                  ID: <span className="font-roboto-mono">{form.id}</span>
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6 opacity-80">
                  <div>
                    <span className="block text-xs uppercase opacity-70">Cost</span>
                    <span className="font-bold">{form.cost}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase opacity-70">Rarity</span>
                    <span className="font-bold">{form.rarity}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase opacity-70">Element</span>
                    <span className="font-bold">{form.element}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEditCard(index)}
                    className="flex-grow btn-secondary py-2 px-4 rounded-lg flex items-center justify-center bg-[var(--clr-primary)]/20 hover:bg-[var(--clr-primary)]/40 text-[var(--clr-text-on-primary)]"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => duplicateCardForm(index)}
                    className="p-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/40 text-gray-300"
                    title="Duplicate Character"
                  >
                    <Copy className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeCardForm(index, form.id)}
                    className="p-2 rounded-lg bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 text-[var(--clr-danger)]"
                    title="Delete Character"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {patchState.cardForms.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full py-20 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-[var(--clr-border)] rounded-2xl bg-[var(--clr-bg-card)]/50"
        >
          <PlusCircle className="w-16 h-16 mb-4 text-[var(--clr-primary)]" />
          <h3 className="text-xl font-rajdhani">No Characters Found</h3>
          <p className="text-[var(--clr-text-muted)]">Click 'Add Character' to begin.</p>
        </motion.div>
      )}
    </div>
  );
};
