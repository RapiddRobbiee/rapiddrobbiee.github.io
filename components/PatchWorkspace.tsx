import React, { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { CardForm, DokkanID, DokkanPatchState, Settings } from '../types';
import { CharacterFormEditor } from './CharacterFormEditor';

const getAlphaBetaBaseId = (id: DokkanID): string | null =>
  /^[0-9]+[01]$/.test(String(id)) ? String(id).slice(0, -1) : null;

interface CardGroup {
  key: string;
  cards: Array<{ card: CardForm; index: number }>;
}

interface PatchWorkspaceProps {
  patchState: DokkanPatchState;
  selectedCardIndex: number;
  setSelectedCardIndex: (index: number) => void;
  addCardForm: () => void;
  duplicateCardForm: (index: number) => void;
  removeCardForm: (index: number, cardId: DokkanID) => void;
  updateCardForm: (index: number, updatedForm: CardForm) => void;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  settings: Settings;
  dbInstance: any;
  anyOperationLoading: boolean;
  skillCausalities: any[];
  onCreateSkillCausality: (
    type: number,
    value1: number | string,
    value2: number | string,
    value3: number | string
  ) => Promise<DokkanID>;
  onFetchSkillCausality: (id: DokkanID) => Promise<void>;
}

export const PatchWorkspace: React.FC<PatchWorkspaceProps> = ({
  patchState,
  selectedCardIndex,
  setSelectedCardIndex,
  addCardForm,
  duplicateCardForm,
  removeCardForm,
  updateCardForm,
  setPatchState,
  settings,
  dbInstance,
  anyOperationLoading,
  skillCausalities,
  onCreateSkillCausality,
  onFetchSkillCausality,
}) => {
  const selectedCard = patchState.cardForms[selectedCardIndex];
  const cardGroups = useMemo<CardGroup[]>(() => {
    const groups = new Map<string, CardGroup>();
    patchState.cardForms.forEach((card, index) => {
      const baseId = getAlphaBetaBaseId(card.id);
      const key = baseId && patchState.cardForms.some((candidate, candidateIndex) =>
        candidateIndex !== index && getAlphaBetaBaseId(candidate.id) === baseId
      ) ? `pair-${baseId}` : `card-${index}`;
      const group = groups.get(key) || { key, cards: [] };
      group.cards.push({ card, index });
      groups.set(key, group);
    });
    return Array.from(groups.values());
  }, [patchState.cardForms]);

  const updateSelectedCard = (index: number, updatedForm: CardForm) => {
    const originalCard = patchState.cardForms[index];
    const baseId = originalCard ? getAlphaBetaBaseId(originalCard.id) : null;
    const pairIndex = baseId === null ? -1 : patchState.cardForms.findIndex(
      (candidate, candidateIndex) => candidateIndex !== index && getAlphaBetaBaseId(candidate.id) === baseId
    );

    updateCardForm(index, updatedForm);
    if (settings.syncAlphaBetaEdits && pairIndex !== -1) {
      updateCardForm(pairIndex, { ...updatedForm, id: patchState.cardForms[pairIndex].id });
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col gap-4" aria-label="Patch editor">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clr-text-muted)]">Patch workspace</p>
          
          <p className="mt-1 text-m text-[var(--clr-text-muted)]">Choose a card, then edit its complete data set without leaving the canvas.</p>
        </div>
        <button onClick={addCardForm} disabled={anyOperationLoading} className="btn-primary flex items-center gap-2 px-4 py-3 text-sm disabled:opacity-50">
          <Plus size={18} /> Add card
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <aside className="sidebar-card flex min-h-0 shrink-0 flex-col xl:w-72" aria-label="Cards in patch">
          <div className="border-b border-[var(--clr-border)] px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--clr-text)]">Cards in patch</h2>
              <span className="rounded-full bg-[var(--clr-primary)]/15 px-2 py-1 text-xs font-bold text-[var(--clr-accent)]">{cardGroups.length}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--clr-text-muted)]">Select a card to edit its full record.</p>
          </div>

          <div className="overflow-y-auto p-2">
            {cardGroups.map((group) => {
              const isPair = group.cards.length > 1;
              const displayCard = group.cards[0].card;
              return (
                <div key={group.key} className={`mb-2 rounded-xl border ${isPair ? 'border-[var(--clr-border)] bg-[var(--clr-bg-main)]/20 p-2' : 'border-transparent'}`}>
                  {isPair && (
                    <div className="px-2 pb-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[var(--clr-text)]">{displayCard.name || 'Final card'}</span>
                        <span className="rounded-full bg-[var(--clr-secondary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--clr-accent)]">Card 0 + Card 1</span>
                      </div>
                      <span className="mt-1 block text-[11px] text-[var(--clr-text-muted)]">One final card · two required forms</span>
                    </div>
                  )}
                  {group.cards.map(({ card, index }) => {
                    const isSelected = index === selectedCardIndex;
                    const role = String(card.id).endsWith('0') ? '0' : String(card.id).endsWith('1') ? '1' : null;
                    return (
                      <button
                        key={`${card.id}-${index}`}
                        onClick={() => setSelectedCardIndex(index)}
                        className={`mb-1 w-full rounded-lg border p-3 text-left transition-colors last:mb-0 ${isSelected ? 'border-[var(--clr-primary)] bg-[var(--clr-primary)]/15' : 'border-transparent bg-[var(--clr-bg-main)]/30 hover:border-[var(--clr-border-focus)]'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`truncate font-bold ${isSelected ? 'text-[var(--clr-accent)]' : 'text-[var(--clr-text)]'}`}>{role ? `${role} card` : card.name || `Card ${index + 1}`}</span>
                          <span className="shrink-0 text-xs text-[var(--clr-text-muted)]">#{index + 1}</span>
                        </div>
                        <span className="mt-1 block truncate font-roboto-mono text-[11px] text-[var(--clr-text-muted)]">{card.id}</span>
                        <span className="mt-2 block text-xs text-[var(--clr-text-muted)]">{card.name || 'Unnamed'} · {card.element || 'Element'} · Rarity {card.rarity || '—'}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {selectedCard && (
            <div className="grid grid-cols-2 gap-2 border-t border-[var(--clr-border)] p-3">
              <button onClick={() => duplicateCardForm(selectedCardIndex)} disabled={anyOperationLoading} className="btn-secondary flex items-center justify-center gap-1 px-2 py-2 text-xs disabled:opacity-50">
                <Copy size={14} /> Duplicate
              </button>
              <button onClick={() => removeCardForm(selectedCardIndex, selectedCard.id)} disabled={anyOperationLoading || patchState.cardForms.length <= 1} className="btn-danger flex items-center justify-center gap-1 px-2 py-2 text-xs disabled:opacity-50">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}
        </aside>

        <div className="card min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedCard ? (
            <CharacterFormEditor
              formIndex={selectedCardIndex}
              cardForm={selectedCard}
              updateCardForm={updateSelectedCard}
              removeCardForm={() => removeCardForm(selectedCardIndex, selectedCard.id)}
              duplicateCardForm={duplicateCardForm}
              patchState={patchState}
              setPatchState={setPatchState}
              defaultAdvancedOpen={settings.defaultAdvancedOpen}
              dbInstance={dbInstance}
              settings={settings}
              skillCausalities={skillCausalities}
              onCreateSkillCausality={onCreateSkillCausality}
              onFetchSkillCausality={onFetchSkillCausality}
            />
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center text-center">
              <div>
                <h2 className="text-2xl font-bold text-[var(--clr-text)]">No cards yet</h2>
                <p className="mt-2 text-sm text-[var(--clr-text-muted)]">Add a card to start building the patch.</p>
                <button onClick={addCardForm} className="btn-primary mt-4 px-4 py-2">Add card</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
