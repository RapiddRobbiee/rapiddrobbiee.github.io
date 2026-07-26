import React, { useState, useCallback } from 'react';
import {
  DokkanPatchState,
  PassiveSkillSet,
  LeaderSkillSet,
  SpecialSet,
  ActiveSkillSet,
  PassiveSkill,
  LeaderSkill,
  Special,
  ActiveSkillEffect,
  DokkanID,
  TargetSkillSetType,
  AnySkill,
  AnySkillSet,
  AppSettings,
} from '../types';
import {
  INITIAL_PASSIVE_SKILL,
  INITIAL_LEADER_SKILL,
  INITIAL_SPECIAL_SKILL,
  INITIAL_ACTIVE_SKILL_EFFECT,
  generateLocalId,
  generateCausalityId,
  ID_PREFIXES,
} from '../constants';
import { FormInput, FormTextArea, FormSelect } from './FormControls';
import { SkillDetailEditor } from './SkillDetailEditor';
import { ImportSkillsModal } from './ImportSkillsModal';
import { CausalityEditor } from './CausalityEditor';
import type { Database as SqlJsDatabase } from 'sql.js';
import { logAnalyticsEvent } from '../services/analyticsService';
import { getSkillCausality } from '../services/databaseService';
import { useToast } from '../context/ToastContext';

interface GlobalSkillSetsEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  dbInstance: SqlJsDatabase | null;
  settings: AppSettings;
}

type SkillSetListKey = 'passiveSkillSets' | 'leaderSkillSets' | 'specialSets' | 'activeSkillSets';

const getSkillNameForListKey = (listKey: SkillSetListKey): string => {
  switch (listKey) {
    case 'passiveSkillSets':
      return 'Passive Effect';
    case 'leaderSkillSets':
      return 'Leader Skill Effect';
    case 'specialSets':
      return 'Special Effect';
    case 'activeSkillSets':
      return 'Active Skill Effect';
    default:
      return 'Effect';
  }
};

// Helper function to generate new skill IDs for duplicated skills within a set
const generateNewSkillIdForDuplicatedSet = (
  newSetId: DokkanID,
  skillType: string,
  skillIndex: number
): DokkanID => {
  const baseSetIdNumStr = String(newSetId).replace(/\D/g, ''); // Use newSetId
  const isBaseSetIdEffectivelyNumeric = baseSetIdNumStr.length > 0;
  const baseSetIdToUse = isBaseSetIdEffectivelyNumeric ? baseSetIdNumStr : newSetId;

  if (skillType === 'Passive Effect' || skillType === 'Special Effect') {
    return skillIndex === 0
      ? String(baseSetIdToUse)
      : String(skillIndex * 100) + String(baseSetIdToUse);
  } else if (skillType === 'Leader Skill Effect') {
    return String(baseSetIdToUse) + String(skillIndex).padStart(2, '0');
  } else if (skillType === 'Active Skill Effect') {
    return String(baseSetIdToUse) + String(skillIndex + 1);
  }
  return generateLocalId(); // Fallback
};

const EMPTY_ARRAY: any[] = [];

export const GlobalSkillSetsEditor: React.FC<GlobalSkillSetsEditorProps> = ({
  patchState,
  setPatchState,
  dbInstance,
  settings,
}) => {
  const { addToast } = useToast();
  const [editingSkillSet, setEditingSkillSet] = useState<{
    type: SkillSetListKey;
    id: DokkanID;
  } | null>(null);
  const [showImportSkillsModal, setShowImportSkillsModal] = useState<boolean>(false);
  const [importTargetType, setImportTargetType] = useState<TargetSkillSetType | null>(null);

  const handleAddSkillSet = (type: SkillSetListKey) => {
    const newIdSuffix = generateLocalId();
    let newSet: AnySkillSet;
    let newId: DokkanID;
    let prefix: string = '';

    switch (type) {
      case 'passiveSkillSets': {
        prefix = ID_PREFIXES.PASSIVE_SKILL_SET;
        newId = prefix + newIdSuffix;
        newSet = {
          id: newId,
          name: `New Global Passive ${newIdSuffix}`,
          itemized_description: '',
          skills: [],
        } as PassiveSkillSet;
        break;
      }
      case 'leaderSkillSets': {
        prefix = ID_PREFIXES.LEADER_SKILL_SET;
        newId = prefix + newIdSuffix;
        newSet = {
          id: newId,
          name: `New Global Leader ${newIdSuffix}`,
          description: '',
          skills: [],
        } as LeaderSkillSet;
        break;
      }
      case 'specialSets': {
        prefix = ID_PREFIXES.SPECIAL_SET;
        newId = prefix + newIdSuffix;
        newSet = {
          id: newId,
          name: `New Global Special ${newIdSuffix}`,
          description: '',
          skills: [],
          aim_target: 0,
          increase_rate: 180,
          lv_bonus: 25,
          is_inactive: 0,
        } as SpecialSet;
        break;
      }
      case 'activeSkillSets': {
        prefix = ID_PREFIXES.ACTIVE_SKILL_SET;
        newId = prefix + newIdSuffix;
        const defaultActiveSkillEffect: ActiveSkillEffect = {
          ...INITIAL_ACTIVE_SKILL_EFFECT(),
          id: newId + '1',
          active_skill_set_id: newId,
        };
        newSet = {
          id: newId,
          name: `New Global Active ${newIdSuffix}`,
          effect_description: '',
          condition_description: '',
          turn: 1,
          exec_limit: 1,
          skills: [defaultActiveSkillEffect],
          costume_special_view_id: 0,
        } as ActiveSkillSet;
        break;
      }
      default:
        return; // Should not happen
    }
    if (newSet) {
      setPatchState((prev) => ({ ...prev, [type]: [...(prev[type] as AnySkillSet[]), newSet] }));
      setEditingSkillSet({ type, id: newId });
      logAnalyticsEvent('add_skill_set', { set_type: type, new_set_id: newId });
    }
  };

  const handleDuplicateSkillSet = (type: SkillSetListKey, idToDuplicate: DokkanID) => {
    const originalSet = (patchState[type] as Array<AnySkillSet>).find((s) => s.id === idToDuplicate);
    if (!originalSet) return;

    const duplicatedSet: AnySkillSet = JSON.parse(JSON.stringify(originalSet)); // Deep copy
    const newIdSuffix = generateLocalId();
    let prefix: string = '';
    switch (type) {
      case 'passiveSkillSets': {
        prefix = ID_PREFIXES.PASSIVE_SKILL_SET;
        break;
      }
      case 'leaderSkillSets': {
        prefix = ID_PREFIXES.LEADER_SKILL_SET;
        break;
      }
      case 'specialSets': {
        prefix = ID_PREFIXES.SPECIAL_SET;
        break;
      }
      case 'activeSkillSets': {
        prefix = ID_PREFIXES.ACTIVE_SKILL_SET;
        break;
      }
    }
    duplicatedSet.id = prefix + newIdSuffix;
    duplicatedSet.name = `Copy of ${originalSet.name}`;

    const skillNameForIdGen = getSkillNameForListKey(type);
    let newSkillsArray: AnySkill[] = [];

    switch (type) {
      case 'passiveSkillSets': {
        const typedOriginalPS = originalSet as PassiveSkillSet;
        newSkillsArray = (typedOriginalPS.skills || []).map((skill, idx) => {
          const newSkill = JSON.parse(JSON.stringify(skill)) as PassiveSkill;
          newSkill.id = generateNewSkillIdForDuplicatedSet(
            duplicatedSet.id,
            skillNameForIdGen,
            idx
          );
          if (newSkill.name) newSkill.name += ' (Copy)';
          return newSkill;
        });
        (duplicatedSet as PassiveSkillSet).skills = newSkillsArray as PassiveSkill[];
        break;
      }
      case 'leaderSkillSets': {
        const typedOriginalLS = originalSet as LeaderSkillSet;
        newSkillsArray = (typedOriginalLS.skills || []).map((skill, idx) => {
          const newSkill = JSON.parse(JSON.stringify(skill)) as LeaderSkill;
          newSkill.id = generateNewSkillIdForDuplicatedSet(
            duplicatedSet.id,
            skillNameForIdGen,
            idx
          );
          // Leader skills don't typically have names, but if they did: if (newSkill.name) newSkill.name += " (Copy)";
          (newSkill as any).leader_skill_set_id = duplicatedSet.id;
          return newSkill;
        });
        (duplicatedSet as LeaderSkillSet).skills = newSkillsArray as LeaderSkill[];
        break;
      }
      case 'specialSets': {
        const typedOriginalSS = originalSet as SpecialSet;
        newSkillsArray = (typedOriginalSS.skills || []).map((skill, idx) => {
          const newSkill = JSON.parse(JSON.stringify(skill)) as Special;
          newSkill.id = generateNewSkillIdForDuplicatedSet(
            duplicatedSet.id,
            skillNameForIdGen,
            idx
          );
          // Specials don't typically have names, but if they did: if (newSkill.name) newSkill.name += " (Copy)";
          (newSkill as any).special_set_id = duplicatedSet.id;
          return newSkill;
        });
        (duplicatedSet as SpecialSet).skills = newSkillsArray as Special[];
        break;
      }
      case 'activeSkillSets': {
        const typedOriginalAS = originalSet as ActiveSkillSet;
        newSkillsArray = (typedOriginalAS.skills || []).map((skill, idx) => {
          const newSkill = JSON.parse(JSON.stringify(skill)) as ActiveSkillEffect;
          newSkill.id = generateNewSkillIdForDuplicatedSet(
            duplicatedSet.id,
            skillNameForIdGen,
            idx
          );
          // Active skill effects don't have names, but if they did: if (newSkill.name) newSkill.name += " (Copy)";
          (newSkill as any).active_skill_set_id = duplicatedSet.id;
          return newSkill;
        });
        (duplicatedSet as ActiveSkillSet).skills = newSkillsArray as ActiveSkillEffect[];
        break;
      }
    }

    logAnalyticsEvent('duplicate_item', {
      item_type: 'skill_set',
      original_id: originalSet.id,
      new_id: duplicatedSet.id,
      set_type: type,
    });

    setPatchState((prev) => ({ ...prev, [type]: [...(prev[type] as Array<AnySkillSet>), duplicatedSet] }));
  };

  const handleUpdateSkillSet = (
    type: SkillSetListKey,
    originalId: DokkanID,
    updatedSet: AnySkillSet
  ) => {
    const newId = updatedSet.id;

    setPatchState((prev) => {
      if (originalId !== newId) {
        let listToCheck: AnySkillSet[] = [];
        switch (type) {
          case 'passiveSkillSets': {
            listToCheck = prev.passiveSkillSets;
            break;
          }
          case 'leaderSkillSets': {
            listToCheck = prev.leaderSkillSets;
            break;
          }
          case 'specialSets': {
            listToCheck = prev.specialSets;
            break;
          }
          case 'activeSkillSets': {
            listToCheck = prev.activeSkillSets || [];
            break;
          }
        }
        if (listToCheck.some((s) => s.id === newId)) {
          addToast(`Error: Skill Set ID "${newId}" is already in use in ${type}.`, { type: 'error' });
          return prev;
        }
      }

      const newPatchState = { ...prev };

      // 1. Update the skill set in its list
      const listKey = type as keyof typeof newPatchState;
      (newPatchState[listKey] as AnySkillSet[]) = (prev[listKey] as AnySkillSet[]).map((s) =>
        s.id === originalId ? updatedSet : s
      );

      // 2. If ID changed, perform cascading updates
      if (originalId !== newId) {
        // Update child skills inside the updated set to point to the new parent ID
        if ('skills' in updatedSet && Array.isArray(updatedSet.skills)) {
          updatedSet.skills.forEach((skill) => {
            if ('leader_skill_set_id' in skill) (skill as LeaderSkill).leader_skill_set_id = newId;
            if ('special_set_id' in skill) (skill as Special).special_set_id = newId;
            if ('active_skill_set_id' in skill)
              (skill as ActiveSkillEffect).active_skill_set_id = newId;
          });
        }

        // Update card forms that reference this skill set
        newPatchState.cardForms = newPatchState.cardForms.map((form) => {
          const updatedForm = { ...form };
          let changed = false;
          if (type === 'passiveSkillSets' && form.passive_skill_set_id === originalId) {
            updatedForm.passive_skill_set_id = newId;
            changed = true;
          }
          if (type === 'leaderSkillSets' && form.leader_skill_set_id === originalId) {
            updatedForm.leader_skill_set_id = newId;
            changed = true;
          }
          if (type === 'activeSkillSets' && form.active_skill_set_id_ref === originalId) {
            updatedForm.active_skill_set_id_ref = newId;
            changed = true;
          }
          return changed ? updatedForm : form;
        });

        // Update junction tables
        if (type === 'specialSets') {
          newPatchState.cardSpecials = newPatchState.cardSpecials.map((cs) =>
            cs.special_set_id === originalId ? { ...cs, special_set_id: newId } : cs
          );
        }
        if (type === 'activeSkillSets') {
          newPatchState.cardActiveSkills = (newPatchState.cardActiveSkills || []).map((cas) =>
            cas.active_skill_set_id === originalId
              ? { ...cas, active_skill_set_id: newId, id: `${cas.card_id}${newId}` }
              : cas
          );
        }
      }

      return newPatchState;
    });

    if (originalId !== newId) {
      setEditingSkillSet({ type, id: newId });
    }
  };

  const handleRemoveSkillSet = (type: SkillSetListKey, idToRemove: DokkanID) => {
    if (
      window.confirm(
        `Are you sure you want to delete skill set ${idToRemove}? This might break Card Form references.`
      )
    ) {
      setPatchState((prev) => {
        logAnalyticsEvent('remove_skill_set', { set_type: type, removed_set_id: idToRemove });
        return {
          ...prev,
          [type]: (prev[type] as Array<{ id: DokkanID }>).filter((s) => s.id !== idToRemove),
        };
      });
      if (editingSkillSet?.id === idToRemove) setEditingSkillSet(null);
    }
  };

  const openImportModal = (targetType: TargetSkillSetType) => {
    if (!dbInstance) {
      addToast('Please load a database file first to import skills.', { type: 'warning' });
      return;
    }
    setImportTargetType(targetType);
    setShowImportSkillsModal(true);
    logAnalyticsEvent('open_import_modal', {
      target_type: targetType,
      from: 'global_skill_sets_editor',
    });
  };

  const handleSkillsImported = (importData: {
    type: 'set' | 'skills';
    data: AnySkillSet | AnySkill[];
  }) => {
    if (!editingSkillSet || !importTargetType) return;

    const { type: currentEditingSetType, id: currentEditingSetId } = editingSkillSet;

    if (importTargetType !== currentEditingSetType) {
      console.error(
        'Mismatched target type for import. Expected:',
        currentEditingSetType,
        'Got:',
        importTargetType
      );
      addToast('Error: Mismatched skill type during import.', { type: 'error' });
      return;
    }

    setPatchState((prev) => {
      const updatedPatchState = { ...prev };
      // Let TypeScript infer the specific array type (e.g., PassiveSkillSet[])
      const currentListForType = prev[currentEditingSetType];
      const setIndex = currentListForType.findIndex((s) => s.id === currentEditingSetId);

      if (setIndex === -1) {
        console.error('Target set not found for import:', currentEditingSetId);
        addToast('Error: Target skill set not found.', { type: 'error' });
        return prev;
      }

      // `originalSetFromPatch` will be of the specific type (e.g., PassiveSkillSet)
      const originalSetFromPatch = currentListForType[setIndex];
      // `modifiedSetTyped` will also be of the specific type
      const modifiedSetTyped = { ...originalSetFromPatch };

      if (importData.type === 'set') {
        const importedFullSet = importData.data as AnySkillSet; // Source type
        modifiedSetTyped.name = importedFullSet.name;

        switch (currentEditingSetType) {
          case 'passiveSkillSets': {
            const targetPS = modifiedSetTyped as PassiveSkillSet;
            const sourcePS = importedFullSet as PassiveSkillSet; // Cast source
            targetPS.itemized_description = sourcePS.itemized_description;
            targetPS.skills = sourcePS.skills;
            break;
          }
          case 'leaderSkillSets': {
            const targetLS = modifiedSetTyped as LeaderSkillSet;
            const sourceLS = importedFullSet as LeaderSkillSet; // Cast source
            targetLS.description = sourceLS.description;
            targetLS.skills = sourceLS.skills;
            break;
          }
          case 'specialSets': {
            const targetSS = modifiedSetTyped as SpecialSet;
            const sourceSS = importedFullSet as SpecialSet; // Cast source
            targetSS.description = sourceSS.description;
            targetSS.causality_description = sourceSS.causality_description;
            targetSS.aim_target = sourceSS.aim_target;
            targetSS.increase_rate = sourceSS.increase_rate;
            targetSS.lv_bonus = sourceSS.lv_bonus;
            targetSS.is_inactive = sourceSS.is_inactive;
            targetSS.skills = sourceSS.skills;
            break;
          }
          case 'activeSkillSets': {
            const targetAS = modifiedSetTyped as ActiveSkillSet;
            const sourceAS = importedFullSet as ActiveSkillSet; // Cast source
            targetAS.effect_description = sourceAS.effect_description;
            targetAS.condition_description = sourceAS.condition_description;
            targetAS.turn = sourceAS.turn;
            targetAS.exec_limit = sourceAS.exec_limit;
            targetAS.causality_conditions = sourceAS.causality_conditions;
            targetAS.ultimate_special_id = sourceAS.ultimate_special_id;
            targetAS.special_view_id = sourceAS.special_view_id;
            targetAS.costume_special_view_id = sourceAS.costume_special_view_id;
            targetAS.bgm_id = sourceAS.bgm_id;
            targetAS.skills = sourceAS.skills;
            break;
          }
        }
        addToast(
          `Full content of set '${importedFullSet.name}' imported into current set '${modifiedSetTyped.name}' (ID: ${modifiedSetTyped.id}).`,
          { type: 'success' }
        );
        logAnalyticsEvent('import_skill_set_content', {
          set_type: currentEditingSetType,
          target_set_id: currentEditingSetId,
          imported_set_id: importedFullSet.id,
        });
      } else {
        // importData.type === 'skills'
        const importedSkillsArray = importData.data as AnySkill[];
        const skillNameForIdGen = getSkillNameForListKey(currentEditingSetType);

        const newSkillsToAdd = importedSkillsArray.map((importedSkill) => {
          const newSkill = { ...importedSkill } as AnySkill & { id: DokkanID }; // Base type for copy
          newSkill.id = generateNewSkillIdForDuplicatedSet(
            modifiedSetTyped.id,
            skillNameForIdGen,
            (modifiedSetTyped.skills || []).length + importedSkillsArray.indexOf(importedSkill)
          );
          if ('name' in newSkill && typeof (newSkill as { name?: string }).name === 'string') {
            (newSkill as { name: string }).name += ' (Copy)';
          }
          // Important: Ensure the parent set ID is correctly assigned in the new skill object
          const parentIdField = Object.keys(newSkill).find((k) => k.endsWith('_set_id')) as
            | keyof typeof newSkill
            | undefined;
          if (parentIdField) {
            (newSkill as any)[parentIdField] = modifiedSetTyped.id;
          }
          return newSkill;
        });

        switch (currentEditingSetType) {
          case 'passiveSkillSets':
            (modifiedSetTyped as PassiveSkillSet).skills = [
              ...((modifiedSetTyped as PassiveSkillSet).skills || []),
              ...(newSkillsToAdd as PassiveSkill[]),
            ];
            break;
          case 'leaderSkillSets':
            (modifiedSetTyped as LeaderSkillSet).skills = [
              ...((modifiedSetTyped as LeaderSkillSet).skills || []),
              ...(newSkillsToAdd as LeaderSkill[]),
            ];
            break;
          case 'specialSets':
            (modifiedSetTyped as SpecialSet).skills = [
              ...((modifiedSetTyped as SpecialSet).skills || []),
              ...(newSkillsToAdd as Special[]),
            ];
            break;
          case 'activeSkillSets':
            (modifiedSetTyped as ActiveSkillSet).skills = [
              ...((modifiedSetTyped as ActiveSkillSet).skills || []),
              ...(newSkillsToAdd as ActiveSkillEffect[]),
            ];
            break;
        }
        addToast(`${importedSkillsArray.length} skill effects imported and appended to current set.`, { type: 'success' });
        logAnalyticsEvent('import_skill_effects', {
          set_type: currentEditingSetType,
          target_set_id: currentEditingSetId,
          num_effects_imported: importedSkillsArray.length,
        });
      }

      // `finalNewList` will be of the correct specific array type
      const finalNewList = currentListForType.map((item, idx) =>
        idx === setIndex ? modifiedSetTyped : item
      );

      // This assignment is now type-correct
      (updatedPatchState as any)[currentEditingSetType] = finalNewList;
      return updatedPatchState;
    });

    setShowImportSkillsModal(false);
    setImportTargetType(null);
  };

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

    // Check if already exists - use functional update to access latest state if needed, 
    // but here we need to check before setting. 
    // We can't easily access latest patchState inside useCallback without adding it to dependency,
    // which defeats the purpose if patchState changes often.
    // Solution: We can use a ref for patchState or just accept that we might fetch redundantly if state is stale? 
    // Actually, checking patchState.skillCausalities here is fine if we accept it might be one render behind?
    // But wait, if we type fast, patchState changes.

    // Let's use a functional update pattern for the check if possible, or just rely on the fact that 
    // dbInstance and setPatchState are stable. 
    // But we need to read `patchState.skillCausalities`.
    // If we add `patchState.skillCausalities` to dependency, it changes whenever we add a causality.
    // But it DOES NOT change when we edit a text field in a skill.
    // So adding `patchState.skillCausalities` to dependency is safe!

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

  const renderSkillSetEditor = (type: SkillSetListKey) => {
    if (!editingSkillSet || editingSkillSet.type !== type) return null;
    const currentSet = (patchState[type] as Array<AnySkillSet>).find(
      (s) => s.id === editingSkillSet!.id
    );
    if (!currentSet)
      return <p className="text-[var(--clr-danger)]">Error: Selected skill set not found.</p>;

    let initialSkillFactory: () => AnySkill;
    let skillDetailName: string;
    let specificSkills: AnySkill[];
    const originalSetId = currentSet.id;

    switch (type) {
      case 'passiveSkillSets':
        initialSkillFactory = () => INITIAL_PASSIVE_SKILL();
        skillDetailName = 'Passive Effect';
        specificSkills = (currentSet as PassiveSkillSet).skills;
        break;
      case 'leaderSkillSets':
        initialSkillFactory = () => INITIAL_LEADER_SKILL();
        skillDetailName = 'Leader Skill Effect';
        specificSkills = (currentSet as LeaderSkillSet).skills;
        break;
      case 'specialSets':
        initialSkillFactory = () => INITIAL_SPECIAL_SKILL();
        skillDetailName = 'Special Effect';
        specificSkills = (currentSet as SpecialSet).skills;
        break;
      case 'activeSkillSets':
        initialSkillFactory = () => INITIAL_ACTIVE_SKILL_EFFECT();
        skillDetailName = 'Active Skill Effect';
        specificSkills = (currentSet as ActiveSkillSet).skills;
        break;
      default:
        return null;
    }

    const importButton = (
      <button
        onClick={() => openImportModal(type)}
        disabled={!dbInstance}
        className="btn-secondary py-2 px-4 rounded-md disabled:opacity-50 mt-2 mb-4"
        title={
          !dbInstance ? 'Load DB to enable import' : 'Import skill set content or effects from DB'
        }
      >
        <i className="fas fa-database mr-2"></i> Import from DB
      </button>
    );

    return (
      <div className="p-5 card shadow-xl">
        <h4 className="text-2xl font-bold mb-4 text-[var(--clr-accent)] font-rajdhani">
          Editing {type.replace(/([A-Z])/g, ' $1').replace('Skill Sets', 'Skill Set')}:{' '}
          <span className="text-[var(--clr-text)]">{currentSet.name}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <FormInput
            label="ID"
            value={currentSet.id}
            onChange={(val) =>
              handleUpdateSkillSet(type, originalSetId, { ...currentSet, id: val } as AnySkillSet)
            }
            className="font-roboto-mono"
          />
          <FormInput
            label="Name"
            value={currentSet.name}
            onChange={(val) =>
              handleUpdateSkillSet(type, originalSetId, { ...currentSet, name: val } as AnySkillSet)
            }
          />

          {type === 'passiveSkillSets' && (
            <FormTextArea
              label="Itemized Description"
              value={(currentSet as PassiveSkillSet).itemized_description || ''}
              onChange={(val) =>
                handleUpdateSkillSet(type, originalSetId, {
                  ...currentSet,
                  itemized_description: val,
                } as PassiveSkillSet)
              }
              rows={4}
              className="md:col-span-2"
            />
          )}

          {type === 'leaderSkillSets' && (
            <FormTextArea
              label="Description"
              value={(currentSet as LeaderSkillSet).description || ''}
              onChange={(val) =>
                handleUpdateSkillSet(type, originalSetId, {
                  ...currentSet,
                  description: val,
                } as LeaderSkillSet)
              }
              rows={2}
              className="md:col-span-2"
              helpText="This is a database field and will be included in the SQL patch."
            />
          )}

          {type === 'specialSets' && (
            <>
              <FormTextArea
                label="Description"
                value={(currentSet as SpecialSet).description || ''}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    description: val,
                  } as SpecialSet)
                }
                className="md:col-span-2"
                rows={2}
                helpText="This is a database field and will be included in the SQL patch."
              />
              <FormTextArea
                label="Causality Description"
                value={(currentSet as SpecialSet).causality_description || ''}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    causality_description: val,
                  } as SpecialSet)
                }
                className="md:col-span-2"
                rows={2}
              />
              <FormInput
                label="Aim Target"
                type="number"
                value={(currentSet as SpecialSet).aim_target}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    aim_target: Number(val),
                  } as SpecialSet)
                }
              />
              <FormInput
                label="Increase Rate"
                type="number"
                value={(currentSet as SpecialSet).increase_rate}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    increase_rate: Number(val),
                  } as SpecialSet)
                }
              />
              <FormInput
                label="Level Bonus"
                type="number"
                value={(currentSet as SpecialSet).lv_bonus}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    lv_bonus: Number(val),
                  } as SpecialSet)
                }
              />
              <FormSelect
                label="Is Inactive"
                value={(currentSet as SpecialSet).is_inactive}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    is_inactive: Number(val),
                  } as SpecialSet)
                }
                options={[
                  { label: 'Active', value: 0 },
                  { label: 'Inactive', value: 1 },
                ]}
              />
            </>
          )}

          {type === 'activeSkillSets' && (
            <>
              <FormTextArea
                label="Effect Description"
                value={(currentSet as ActiveSkillSet).effect_description}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    effect_description: val,
                  } as ActiveSkillSet)
                }
                className="md:col-span-2"
              />
              <FormTextArea
                label="Condition Description"
                value={(currentSet as ActiveSkillSet).condition_description}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    condition_description: val,
                  } as ActiveSkillSet)
                }
                className="md:col-span-2"
              />
              <FormInput
                label="Turn Requirement"
                type="number"
                value={(currentSet as ActiveSkillSet).turn}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    turn: Number(val),
                  } as ActiveSkillSet)
                }
              />
              <FormInput
                label="Execution Limit"
                type="number"
                value={(currentSet as ActiveSkillSet).exec_limit}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    exec_limit: Number(val),
                  } as ActiveSkillSet)
                }
              />
              <FormInput
                label="Ultimate Special ID"
                type="number"
                value={(currentSet as ActiveSkillSet).ultimate_special_id ?? ''}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    ultimate_special_id: val ? Number(val) : null,
                  } as ActiveSkillSet)
                }
                placeholder="Optional"
              />
              <FormInput
                label="Special View ID"
                type="number"
                value={(currentSet as ActiveSkillSet).special_view_id ?? ''}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    special_view_id: val ? Number(val) : null,
                  } as ActiveSkillSet)
                }
                placeholder="Optional"
              />
              <FormInput
                label="Costume Special View ID"
                type="number"
                value={(currentSet as ActiveSkillSet).costume_special_view_id}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    costume_special_view_id: Number(val),
                  } as ActiveSkillSet)
                }
              />
              <FormInput
                label="BGM ID"
                type="number"
                value={(currentSet as ActiveSkillSet).bgm_id ?? ''}
                onChange={(val) =>
                  handleUpdateSkillSet(type, originalSetId, {
                    ...currentSet,
                    bgm_id: val ? Number(val) : null,
                  } as ActiveSkillSet)
                }
                placeholder="Optional"
                className="font-roboto-mono"
              />
              {settings.enableVisualCausalityEditor ? (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--clr-text-muted)] mb-1">
                    Causality Conditions
                  </label>
                  <CausalityEditor
                    jsonString={(currentSet as ActiveSkillSet).causality_conditions || ''}
                    onChange={(val) =>
                      handleUpdateSkillSet(type, originalSetId, {
                        ...currentSet,
                        causality_conditions: val || null,
                      } as ActiveSkillSet)
                    }
                    skillCausalities={patchState.skillCausalities || []}
                    onCreateSkillCausality={handleCreateSkillCausality}
                    isDbLoaded={!!dbInstance}
                    onFetchSkillCausality={handleFetchSkillCausality}
                  />
                </div>
              ) : (
                <FormTextArea
                  label="Causality Conditions (JSON)"
                  value={(currentSet as ActiveSkillSet).causality_conditions || ''}
                  onChange={(val) =>
                    handleUpdateSkillSet(type, originalSetId, {
                      ...currentSet,
                      causality_conditions: val || null,
                    } as ActiveSkillSet)
                  }
                  className="md:col-span-2 font-roboto-mono"
                  rows={2}
                />
              )}
            </>
          )}
        </div>
        {importButton}
        <SkillDetailEditor
          skillSetId={currentSet.id}
          skills={specificSkills as (AnySkill & { id: DokkanID; name?: string })[]}
          updateSkills={(updatedSkills) => {
            let specificUpdatedSkills: AnySkill[];
            switch (type) {
              case 'passiveSkillSets':
                specificUpdatedSkills = updatedSkills as PassiveSkill[];
                break;
              case 'leaderSkillSets':
                specificUpdatedSkills = updatedSkills as LeaderSkill[];
                break;
              case 'specialSets':
                specificUpdatedSkills = updatedSkills as Special[];
                break;
              case 'activeSkillSets':
                specificUpdatedSkills = updatedSkills as ActiveSkillEffect[];
                break;
              default:
                specificUpdatedSkills = updatedSkills;
            }
            handleUpdateSkillSet(type, originalSetId, {
              ...currentSet,
              skills: specificUpdatedSkills,
            } as AnySkillSet);
          }}
          initialSkillFactory={initialSkillFactory}
          skillName={skillDetailName}
          patchState={patchState}
          settings={settings}
          skillCausalities={patchState.skillCausalities || EMPTY_ARRAY}
          onCreateSkillCausality={handleCreateSkillCausality}
          onFetchSkillCausality={handleFetchSkillCausality}
          isDbLoaded={!!dbInstance}
        />
      </div>
    );
  };

  const renderListSection = (title: string, type: SkillSetListKey, items: AnySkillSet[]) => (
    <div className="mb-6 p-4 card">
      <h3 className="text-xl font-bold mb-3 text-[var(--clr-accent)] font-rajdhani">{title}</h3>
      <button
        onClick={() => handleAddSkillSet(type)}
        className="mb-3 btn-secondary py-1.5 px-3 rounded-md text-sm"
      >
        <i className="fas fa-plus mr-1.5"></i> Add New
      </button>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((set) => (
          <li
            key={set.id}
            className={`p-2.5 rounded-md cursor-pointer flex justify-between items-center transition-all duration-150 ease-in-out shadow-sm hover:shadow-md font-rajdhani text-sm
                          ${editingSkillSet?.type === type && editingSkillSet?.id === set.id
                ? 'bg-[var(--clr-primary)] text-white ring-1 ring-[var(--clr-accent)]'
                : 'bg-[var(--clr-bg-card)] hover:bg-[var(--clr-bg-main)]/80 hover:text-[var(--clr-accent)]'
              }`}
            onClick={() => setEditingSkillSet({ type, id: set.id })}
          >
            <span className="truncate">
              <span className="font-roboto-mono text-xs opacity-70 mr-1">{set.id}</span> -{' '}
              {set.name}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicateSkillSet(type, set.id);
                }}
                className="text-[var(--clr-text-accent)] hover:text-[var(--clr-primary)] hover:bg-[var(--clr-primary)]/20 rounded-full p-0.5 px-1.5 text-xs transition-colors"
                title="Duplicate Set"
              >
                <i className="fas fa-copy"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSkillSet(type, set.id);
                }}
                className="text-[var(--clr-danger)] hover:text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/20 rounded-full p-0.5 px-1.5 text-xs transition-colors"
                title="Remove Set"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[var(--clr-text-muted)] italic">No sets added yet.</p>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
        <div className="md:col-span-1 space-y-4">
          {renderListSection('Passive Skill Sets', 'passiveSkillSets', patchState.passiveSkillSets)}
          {renderListSection('Leader Skill Sets', 'leaderSkillSets', patchState.leaderSkillSets)}
          {renderListSection('Special Sets', 'specialSets', patchState.specialSets)}
          {renderListSection(
            'Active Skill Sets',
            'activeSkillSets',
            patchState.activeSkillSets || []
          )}
        </div>
        <div className="md:col-span-2">
          {editingSkillSet ? (
            renderSkillSetEditor(editingSkillSet.type)
          ) : (
            <p className="text-center text-[var(--clr-text-muted)] font-rajdhani text-lg italic mt-10">
              Select a skill set to edit or create a new one.
            </p>
          )}
        </div>
      </div>
      {showImportSkillsModal && dbInstance && importTargetType && (
        <ImportSkillsModal
          isOpen={showImportSkillsModal}
          onClose={() => {
            setShowImportSkillsModal(false);
            setImportTargetType(null);
          }}
          dbInstance={dbInstance}
          targetSkillSetType={importTargetType}
          onSkillsImported={handleSkillsImported}
        />
      )}
    </>
  );
};
