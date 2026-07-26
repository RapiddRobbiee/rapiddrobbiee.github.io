import React, { useEffect } from 'react';
import { DokkanPatchState, OptimalAwakeningGrowth } from '../types';
import { FormInput, FormCheckbox } from './FormControls';
import { ID_PREFIXES, isLocallyGeneratedId, generateLocalId } from '../constants';
import { SearchableSelect } from './SearchableSelect';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../context/ToastContext';

interface EZAEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
}

export const EZAEditor: React.FC<EZAEditorProps> = ({ patchState, setPatchState }) => {
  const { addToast } = useToast();
  useEffect(() => {
    // This effect now only syncs the OAG row ID if the base card ID changes.
    // It no longer incorrectly derives and overwrites the optimal_awakening_grow_type.
    if (patchState.isEZA && patchState.baseCardIdForEZA) {
      setPatchState((prev) => {
        if (
          !prev.optimalAwakeningGrowth ||
          !prev.baseCardIdForEZA ||
          prev.baseCardIdForEZA.length < 1
        )
          return prev;

        const baseIdForEza = prev.baseCardIdForEZA;
        const newOagRowId =
          ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + baseIdForEza.slice(0, -1) + '0';

        let needsUpdate = false;
        const updatedOag = { ...prev.optimalAwakeningGrowth };

        // Update OAG row ID if it's local and baseCardId changed
        if (isLocallyGeneratedId(updatedOag.id) && updatedOag.id !== newOagRowId) {
          updatedOag.id = newOagRowId;
          needsUpdate = true;
        }

        if (needsUpdate) {
          return { ...prev, optimalAwakeningGrowth: updatedOag };
        }
        return prev;
      });
    }
  }, [patchState.isEZA, patchState.baseCardIdForEZA, setPatchState]);

  const handleIsEZAChange = (checked: boolean) => {
    const baseCardIdForEZA =
      patchState.baseCardIdForEZA ||
      (patchState.cardForms.length > 0 ? patchState.cardForms[0].id : generateLocalId());

    setPatchState((prev) => {
      const baseCardForm = prev.cardForms.find((cf) => cf.id === baseCardIdForEZA);

      let initialPassiveId = '';
      let initialLeaderId = '';

      if (baseCardForm) {
        initialPassiveId = baseCardForm.passive_skill_set_id || '';
        initialLeaderId = baseCardForm.leader_skill_set_id || '';
      }

      const existingOagPassiveId = prev.optimalAwakeningGrowth?.passive_skill_set_id;
      const existingOagLeaderId = prev.optimalAwakeningGrowth?.leader_skill_set_id;

      let oagRowIdSuffix = baseCardIdForEZA;

      if (baseCardIdForEZA && baseCardIdForEZA.length > 0) {
        const basePrefix = baseCardIdForEZA.slice(0, -1);
        oagRowIdSuffix = basePrefix + '0';
      }

      const oagRowId = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + oagRowIdSuffix;

      const newOptimalAwakeningGrowth: OptimalAwakeningGrowth = {
        id: prev.optimalAwakeningGrowth?.id || oagRowId,
        // Default to empty string to force user input, preventing incorrect derivation.
        optimal_awakening_grow_type: prev.optimalAwakeningGrowth?.optimal_awakening_grow_type || '',
        step: prev.optimalAwakeningGrowth?.step || 7,
        lv_max: prev.optimalAwakeningGrowth?.lv_max || 140,
        skill_lv_max: prev.optimalAwakeningGrowth?.skill_lv_max || 15,
        passive_skill_set_id:
          existingOagPassiveId !== undefined ? existingOagPassiveId : initialPassiveId,
        leader_skill_set_id:
          existingOagLeaderId !== undefined ? existingOagLeaderId : initialLeaderId,
      };

      // If OAG already exists, ensure its row ID is synced if baseCardIdForEZA has changed
      if (
        prev.optimalAwakeningGrowth &&
        prev.baseCardIdForEZA &&
        prev.baseCardIdForEZA !== baseCardIdForEZA
      ) {
        newOptimalAwakeningGrowth.id = oagRowId;
      }

      logAnalyticsEvent('toggle_eza_mode', { is_eza: checked, base_card_id: baseCardIdForEZA });

      return {
        ...prev,
        isEZA: checked,
        baseCardIdForEZA: checked ? baseCardIdForEZA : prev.baseCardIdForEZA, // Keep baseCardIdForEZA if unchecking
        optimalAwakeningGrowth: checked ? newOptimalAwakeningGrowth : undefined,
      };
    });
  };

  const handleBaseCardIdChange = (value: string) => {
    setPatchState((prev) => ({ ...prev, baseCardIdForEZA: value }));
  };

  const handleOptimalGrowthChange = (
    field: keyof OptimalAwakeningGrowth,
    value: string | number
  ) => {
    setPatchState((prev) => {
      if (field === 'optimal_awakening_grow_type') {
        const newId = String(value);
        const originalId = prev.optimalAwakeningGrowth?.optimal_awakening_grow_type;
        if (newId !== originalId && prev.cardForms.some((c) => c.id === newId)) {
          addToast(`Error: The Growth Type Key "${newId}" conflicts with an existing Card ID.`, { type: 'error' });
          return prev;
        }
      }
      return {
        ...prev,
        optimalAwakeningGrowth: prev.optimalAwakeningGrowth
          ? { ...prev.optimalAwakeningGrowth, [field]: value }
          : undefined,
      };
    });
  };

  const passiveSkillSetOptions = [
    { label: 'Enter Custom Passive Set ID', value: 'custom_id' },
    ...patchState.passiveSkillSets.map((ps) => ({ label: `${ps.id} - ${ps.name}`, value: ps.id })),
  ];
  const leaderSkillSetOptions = [
    { label: 'Enter Custom Leader Set ID', value: 'custom_id' },
    ...patchState.leaderSkillSets.map((ls) => ({ label: `${ls.id} - ${ls.name}`, value: ls.id })),
  ];

  return (
    <div className="card p-6">
      <h2 className="text-3xl font-bold mb-8 text-[var(--clr-accent)] font-rajdhani border-b-2 border-[var(--clr-accent)] pb-2">
        Extreme Z-Awakening (EZA) Details
      </h2>

      <FormCheckbox
        label="Is this an EZA patch?"
        checked={patchState.isEZA}
        onChange={handleIsEZAChange}
        className="mb-6 text-lg"
      />

      {patchState.isEZA && (
        <div className="mt-6 space-y-6">
          <FormInput
            label="Base Card ID for EZA (Original Card ID)"
            value={patchState.baseCardIdForEZA || ''}
            onChange={handleBaseCardIdChange}
            placeholder="e.g., 1024061 or 1024060"
            helpText="The ID of the card being EZA'd (either '...0' or '...1' version). Both will be updated."
            className="font-roboto-mono"
          />

          {patchState.optimalAwakeningGrowth && (
            <div className="p-6 border-2 border-[var(--clr-accent)] border-opacity-60 rounded-lg bg-[var(--clr-bg-card)] shadow-lg">
              <h3 className="text-2xl font-semibold mb-6 text-[var(--clr-accent)] font-rajdhani">
                Optimal Awakening Growth Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormInput
                  label="Row ID (optimal_awakening_growths PK)"
                  value={patchState.optimalAwakeningGrowth.id}
                  onChange={(val) => handleOptimalGrowthChange('id', val)}
                  placeholder="e.g., 151025730 (derived from base card '...0' ID)"
                  helpText="Typically '15' + (Base Card ID ending in '0')."
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Growth Type Key (links to cards.optimal_awakening_grow_type)"
                  value={patchState.optimalAwakeningGrowth.optimal_awakening_grow_type}
                  onChange={(val) => handleOptimalGrowthChange('optimal_awakening_grow_type', val)}
                  placeholder="e.g., 1900100 (EZA Card ID ending in '0')"
                  helpText="This should be the numeric ID of the new EZA card, ending in '0'."
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Step (EZA Marker)"
                  type="number"
                  value={patchState.optimalAwakeningGrowth.step}
                  onChange={(val) => handleOptimalGrowthChange('step', Number(val))}
                  helpText="Typically 3 for LR EZA, 7 for TUR EZA."
                />
                <FormInput
                  label="New Max Level"
                  type="number"
                  value={patchState.optimalAwakeningGrowth.lv_max}
                  onChange={(val) => handleOptimalGrowthChange('lv_max', Number(val))}
                  helpText="e.g., 150 for LR EZA, 140 for TUR EZA."
                />
                <FormInput
                  label="New Max Skill Level"
                  type="number"
                  value={patchState.optimalAwakeningGrowth.skill_lv_max}
                  onChange={(val) => handleOptimalGrowthChange('skill_lv_max', Number(val))}
                  helpText="e.g., 25 for LR EZA, 15 for TUR EZA."
                />
                <SearchableSelect
                  label="New Passive Skill Set ID"
                  value={patchState.optimalAwakeningGrowth.passive_skill_set_id}
                  onChange={(val) => handleOptimalGrowthChange('passive_skill_set_id', val)}
                  options={passiveSkillSetOptions}
                  helpText="Select or enter the ID of the new Passive Skill Set for the EZA."
                  className="font-roboto-mono"
                />
                <SearchableSelect
                  label="New/Existing Leader Skill Set ID"
                  value={patchState.optimalAwakeningGrowth.leader_skill_set_id}
                  onChange={(val) => handleOptimalGrowthChange('leader_skill_set_id', val)}
                  options={leaderSkillSetOptions}
                  helpText="Select or enter the ID of the Leader Skill Set (can be original or new)."
                  className="font-roboto-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
