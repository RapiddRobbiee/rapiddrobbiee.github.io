import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { DokkanPatchState, Settings, CardForm, DokkanID, PlannerSlot } from '../types';
import { PatchWorkspace } from './PatchWorkspace';
import { CardPlanner } from './CardPlanner';
import { GlobalSkillSetsEditor } from './GlobalSkillSetsEditor';
import { StandbyFinishEditor } from './StandbyFinishEditor';
import { EZAEditor } from './EZAEditor';
import { MiscTablesEditor } from './MiscTablesEditor';
import { SqlConverter } from './SqlConverter';
import { SqlOutputDisplay } from './SqlOutputDisplay';
import { createSkillCausality, getSkillCausality } from '../services/databaseService';
import { generateLocalId, generateCausalityId } from '../constants';

interface MainContentProps {
  isPatchLoading: boolean;
  currentView: string;
  loginSystemEnabled: boolean;
  settings: Settings;
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  updateCardForm: (index: number, updatedForm: CardForm) => void;
  removeCardForm: (index: number, cardIdToRemove: DokkanID) => void;
  duplicateCardForm: (index: number) => void;
  selectedCardIndex: number;
  setSelectedCardIndex: (index: number) => void;
  addCardForm: () => void;
  anyOperationLoading: boolean;
  plannerSlots: PlannerSlot[];
  setPlannerSlots: React.Dispatch<React.SetStateAction<PlannerSlot[]>>;
  handleSavePlanner: () => void;
  isSavingPlanner: boolean;
  isLoadingPlanner: boolean;
  dbInstance: any;
  openLoadModalForPlanner: (slotId: number) => void;
  generatedSql: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  isPatchLoading,
  currentView,
  loginSystemEnabled,
  settings,
  patchState,
  setPatchState,
  updateCardForm,
  removeCardForm,
  duplicateCardForm,
  selectedCardIndex,
  setSelectedCardIndex,
  addCardForm,
  anyOperationLoading,
  plannerSlots,
  setPlannerSlots,
  handleSavePlanner,
  isSavingPlanner,
  isLoadingPlanner,
  dbInstance,
  openLoadModalForPlanner,
  generatedSql,
}) => {

  const handleCreateSkillCausality = useCallback(async (
    causality_type: number,
    cau_val1: number | string,
    cau_val2: number | string,
    cau_val3: number | string
  ): Promise<DokkanID> => {
    // Generate a local ID for the new causality
    const newId = generateCausalityId();

    const newCausality: any = {
      id: newId,
      causality_type,
      cau_val1,
      cau_val2,
      cau_val3
    };

    setPatchState(prev => ({
      ...prev,
      skillCausalities: [...(prev.skillCausalities || []), newCausality]
    }));

    return newId;
  }, [setPatchState]);

  const handleFetchSkillCausality = useCallback(async (id: DokkanID): Promise<void> => {
    if (!dbInstance) return;

    if (patchState.skillCausalities?.some(sc => String(sc.id) === String(id))) {
      return;
    }

    try {
      const causality = await getSkillCausality(dbInstance, id);
      if (causality) {
        setPatchState(prev => ({
          ...prev,
          skillCausalities: [...(prev.skillCausalities || []), causality]
        }));
      }
    } catch (e) {
      console.error(`Failed to fetch skill causality ${id}:`, e);
    }
  }, [dbInstance, patchState.skillCausalities, setPatchState]);

  return (
    <main className="h-full w-full">
      {isPatchLoading &&
        currentView !== 'sqlOutput' &&
        currentView !== 'sqlConverter' &&
        loginSystemEnabled ? (
        <div className="flex-grow flex items-center justify-center card h-full">
          <i className="fas fa-spinner fa-spin text-4xl text-icon-primary"></i>
          <p className="ml-3 text-xl text-text-accent">Loading Patch Data...</p>
        </div>
      ) : (
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full pr-2 view-entrance"
        >
          {currentView === 'dashboard' && (
            <PatchWorkspace
              patchState={patchState}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
              addCardForm={addCardForm}
              duplicateCardForm={duplicateCardForm}
              removeCardForm={removeCardForm}
              updateCardForm={updateCardForm}
              setPatchState={setPatchState}
              settings={settings}
              dbInstance={dbInstance}
              anyOperationLoading={anyOperationLoading}
              skillCausalities={patchState.skillCausalities}
              onCreateSkillCausality={handleCreateSkillCausality}
              onFetchSkillCausality={handleFetchSkillCausality}
            />
          )}
          {currentView === 'planner' && (
            <CardPlanner
              plannerSlots={plannerSlots}
              setPlannerSlots={setPlannerSlots}
              onSave={handleSavePlanner}
              isSaving={isSavingPlanner || isLoadingPlanner}
              dbInstance={dbInstance}
              onOpenLoadModal={openLoadModalForPlanner}
            />
          )}
          {currentView === 'globalSkillSets' && (
            <GlobalSkillSetsEditor
              patchState={patchState}
              setPatchState={setPatchState}
              dbInstance={dbInstance}
              settings={settings}
            />
          )}
          {currentView === 'ezaDetails' && (
            <div className="h-full overflow-y-auto rounded-xl border border-[var(--clr-border)] bg-[var(--clr-bg-card)]/40 p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.10, duration: 0.35 }}
                className="mb-5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clr-text-muted)]">Optional enhancement</p>
                <h2 className="mt-1 text-3xl font-bold text-[var(--clr-text)]">EZA details</h2>
                <p className="mt-1 text-sm text-[var(--clr-text-muted)]">Configure Extreme Z-Awakening data for the patch.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
              >
                <EZAEditor patchState={patchState} setPatchState={setPatchState} />
              </motion.div>
            </div>
          )}
          {currentView === 'standbyFinish' && (
            <StandbyFinishEditor
              patchState={patchState}
              setPatchState={setPatchState}
              dbInstance={dbInstance}
              settings={settings}
            />
          )}
          {currentView === 'miscTables' && (
            <MiscTablesEditor
              patchState={patchState}
              setPatchState={setPatchState}
              dbInstance={dbInstance}
            />
          )}
          {currentView === 'sqlConverter' && (
            <SqlConverter patchState={patchState} setPatchState={setPatchState} />
          )}
          {currentView === 'sqlOutput' && <SqlOutputDisplay sql={generatedSql} />}
        </motion.div>
      )}
    </main>
  );
};
