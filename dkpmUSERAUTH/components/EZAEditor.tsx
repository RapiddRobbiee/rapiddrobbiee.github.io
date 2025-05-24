
import React, { useEffect } from 'react';
import { DokkanPatchState, OptimalAwakeningGrowth, DokkanID } from '../types';
import { FormInput, FormCheckbox, FormSelect } from './FormControls';
import { ID_PREFIXES, isLocallyGeneratedId, generateLocalId } from '../constants';

interface EZAEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
}

export const EZAEditor: React.FC<EZAEditorProps> = ({ patchState, setPatchState }) => {
  
  useEffect(() => {
    if (patchState.isEZA && patchState.baseCardIdForEZA && isLocallyGeneratedId(patchState.baseCardIdForEZA)) {
      setPatchState(prev => {
        if (!prev.optimalAwakeningGrowth) return prev; // Should not happen if isEZA is true
        
        const newOagId = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + prev.baseCardIdForEZA;
        const newOagTypeId = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_TYPE_ID + prev.baseCardIdForEZA;
        
        if (prev.optimalAwakeningGrowth.id !== newOagId || prev.optimalAwakeningGrowth.growth_type_id !== newOagTypeId) {
          return {
            ...prev,
            optimalAwakeningGrowth: {
              ...prev.optimalAwakeningGrowth,
              id: newOagId,
              growth_type_id: newOagTypeId,
            }
          };
        }
        return prev;
      });
    }
  }, [patchState.isEZA, patchState.baseCardIdForEZA, setPatchState]);


  const handleIsEZAChange = (checked: boolean) => {
    setPatchState(prev => {
      const baseCardId = prev.baseCardIdForEZA || generateLocalId(); // Use existing or generate new if needed
      const oagId = isLocallyGeneratedId(baseCardId) ? ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + baseCardId : generateLocalId();
      const oagTypeId = isLocallyGeneratedId(baseCardId) ? ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_TYPE_ID + baseCardId : generateLocalId();

      return {
        ...prev,
        isEZA: checked,
        baseCardIdForEZA: checked && !prev.baseCardIdForEZA ? baseCardId : prev.baseCardIdForEZA,
        optimalAwakeningGrowth: checked ? (prev.optimalAwakeningGrowth || {
          id: oagId,
          growth_type_id: oagTypeId,
          val1_eza_marker: 7,
          val2_max_level: 140,
          val3_skill_lv_max: 15,
          passive_skill_set_id: '',
          leader_skill_set_id: '',
        }) : undefined,
      };
    });
  };

  const handleBaseCardIdChange = (value: string) => {
    setPatchState(prev => ({ ...prev, baseCardIdForEZA: value }));
  };

  const handleOptimalGrowthChange = (field: keyof OptimalAwakeningGrowth, value: any) => {
    setPatchState(prev => ({
      ...prev,
      optimalAwakeningGrowth: prev.optimalAwakeningGrowth
        ? { ...prev.optimalAwakeningGrowth, [field]: value }
        : undefined,
    }));
  };

  return (
    <div className="p-6 bg-indigo-800 bg-opacity-30 rounded-xl shadow-xl border border-indigo-700">
      <h2 className="text-3xl font-bold mb-8 text-orange-400 font-rajdhani border-b-2 border-orange-500 pb-2">Extreme Z-Awakening (EZA) Details</h2>
      
      <FormCheckbox
        label="Is this an EZA patch?"
        checked={patchState.isEZA}
        onChange={handleIsEZAChange}
        className="mb-6 text-lg"
      />

      {patchState.isEZA && (
        <div className="mt-6 space-y-6">
          <FormInput
            label="Base Card ID for EZA"
            value={patchState.baseCardIdForEZA || ''}
            onChange={handleBaseCardIdChange}
            placeholder="e.g., 1024061 (Original Card ID)"
            helpText="The ID of the card that is being EZA'd. This is used in the `UPDATE cards ...` statement."
            className="font-roboto-mono"
            disabled={!isLocallyGeneratedId(patchState.baseCardIdForEZA || '')}
          />

          {patchState.optimalAwakeningGrowth && (
            <div className="p-6 border-2 border-orange-500 border-opacity-60 rounded-lg bg-indigo-700 bg-opacity-30 shadow-lg">
              <h3 className="text-2xl font-semibold mb-6 text-orange-300 font-rajdhani">Optimal Awakening Growth Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormInput
                  label="Row ID (optimal_awakening_growths)"
                  value={patchState.optimalAwakeningGrowth.id}
                  onChange={(val) => handleOptimalGrowthChange('id', val)}
                  placeholder="Derived from Base Card ID"
                  className="font-roboto-mono"
                  disabled={!isLocallyGeneratedId(patchState.optimalAwakeningGrowth.id)}
                />
                <FormInput
                  label="Growth Type ID (used in cards table)"
                  value={patchState.optimalAwakeningGrowth.growth_type_id}
                  onChange={(val) => handleOptimalGrowthChange('growth_type_id', val)}
                  placeholder="Derived from Base Card ID"
                  className="font-roboto-mono"
                  disabled={!isLocallyGeneratedId(patchState.optimalAwakeningGrowth.growth_type_id)}
                />
                <FormInput
                  label="EZA Marker (val1)"
                  type="number"
                  value={patchState.optimalAwakeningGrowth.val1_eza_marker}
                  onChange={(val) => handleOptimalGrowthChange('val1_eza_marker', Number(val))}
                  helpText="Typically 7 for URs."
                />
                <FormInput
                  label="New Max Level (val2)"
                  type="number"
                  value={patchState.optimalAwakeningGrowth.val2_max_level}
                  onChange={(val) => handleOptimalGrowthChange('val2_max_level', Number(val))}
                  helpText="Typically 140 for EZA URs."
                />
                <FormInput
                  label="New Max Skill Level (val3)"
                  type="number"
                  value={patchState.optimalAwakeningGrowth.val3_skill_lv_max}
                  onChange={(val) => handleOptimalGrowthChange('val3_skill_lv_max', Number(val))}
                  helpText="Typically 15 for EZA URs."
                />
                 <FormSelect 
                  label="New Passive Skill Set ID" 
                  value={patchState.optimalAwakeningGrowth.passive_skill_set_id} 
                  onChange={(val) => handleOptimalGrowthChange('passive_skill_set_id', val)}
                  options={patchState.passiveSkillSets.map(ps => ({ label: `${ps.id} - ${ps.name}`, value: ps.id }))}
                  allowCustom={true}
                  customLabel="Enter Custom Passive Set ID"
                  helpText="Select or enter the ID of the new Passive Skill Set for the EZA."
                  className="font-roboto-mono"
                />
                <FormSelect
                  label="New/Existing Leader Skill Set ID"
                  value={patchState.optimalAwakeningGrowth.leader_skill_set_id}
                  onChange={(val) => handleOptimalGrowthChange('leader_skill_set_id', val)}
                  options={patchState.leaderSkillSets.map(ls => ({ label: `${ls.id} - ${ls.name}`, value: ls.id }))}
                  allowCustom={true}
                  customLabel="Enter Custom Leader Set ID"
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
