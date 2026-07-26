import React, { useState, useCallback } from 'react';
import {
  DokkanPatchState,
  StandbySkillSet,
  FinishSkillSet,
  FinishSpecial,
  BattleParam,
  StandbySkill,
  FinishSkill,
  DokkanID,
  TargetSkillSetType,
  AnySkill,
  AnySkillSet,
  AppSettings,
} from '../types';
import {
  INITIAL_STANDBY_SKILL_SET,
  INITIAL_STANDBY_SKILL,
  INITIAL_FINISH_SKILL_SET,
  INITIAL_FINISH_SKILL,
  INITIAL_FINISH_SPECIAL,
  INITIAL_BATTLE_PARAM,
  INITIAL_STANDBY_SKILL_SET_FINISH_SKILL_SET_RELATION,
  generateLocalId,
  generateCausalityId,
  ID_PREFIXES,
} from '../constants';
import { FormInput, FormTextArea, FormCheckbox } from './FormControls';
import { SkillDetailEditor } from './SkillDetailEditor';
import { ImportSkillsModal } from './ImportSkillsModal';
import type { Database as SqlJsDatabase } from 'sql.js';
import { logAnalyticsEvent } from '../services/analyticsService';
import { SearchableSelect } from './SearchableSelect';
import { createSkillCausality, getSkillCausality } from '../services/databaseService';
import { CausalityEditor } from './CausalityEditor';
import { useToast } from '../context/ToastContext';

interface StandbyFinishEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  dbInstance: SqlJsDatabase | null;
  settings: AppSettings;
}

const EMPTY_ARRAY: any[] = [];

type EditableSection = 'standbySkillSet' | 'finishSkillSet' | 'finishSpecial' | 'battleParam';

// Helper to map SkillSetListKey to a human-readable name for SkillDetailEditor's ID generation
const getSkillNameForSectionType = (sectionType: EditableSection): string => {
  switch (sectionType) {
    case 'standbySkillSet':
      return 'Standby Skill Effect';
    case 'finishSkillSet':
      return 'Finish Skill Effect';
    default:
      return 'Effect';
  }
};

// Helper function to generate new skill IDs for duplicated skills within a set

const generateNewSkillIdForDuplicatedSet = (
  _newSetId: DokkanID,
  skillType: string,
  _skillIndex: number,
  _originalSkillId?: DokkanID
): DokkanID => {
  // Standby/Finish skills often use unique local IDs not strictly tied to parent numeric structure.
  // generateLocalId() ensures uniqueness for these on duplication.
  if (skillType === 'Standby Skill Effect' || skillType === 'Finish Skill Effect') {
    return generateLocalId();
  }
  // Fallback for any other unexpected skillType or for safety
  return generateLocalId();
};

export const StandbyFinishEditor: React.FC<StandbyFinishEditorProps> = ({
  patchState,
  setPatchState,
  dbInstance,
  settings,
}) => {
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState<EditableSection | null>(null);
  const [editingItemId, setEditingItemId] = useState<DokkanID | null>(null);
  const [editingBattleParamNo, setEditingBattleParamNo] = useState<number | null>(null);
  const [showImportSkillsModal, setShowImportSkillsModal] = useState<boolean>(false);
  const [importTargetType, setImportTargetType] = useState<TargetSkillSetType | null>(null);

  const handleAdd = (type: EditableSection) => {
    let newItem: StandbySkillSet | FinishSkillSet | FinishSpecial | BattleParam;
    let newId: DokkanID | number = generateLocalId(); // Default, will be overridden by prefixed IDs for sets

    switch (type) {
      case 'standbySkillSet':
        newItem = INITIAL_STANDBY_SKILL_SET(); // This generates a prefixed ID
        newId = newItem.id;
        setPatchState((prev) => ({
          ...prev,
          standbySkillSets: [...(prev.standbySkillSets || []), newItem as StandbySkillSet],
        }));
        logAnalyticsEvent('add_skill_set', { set_type: 'standbySkillSet', new_set_id: newId });
        break;
      case 'finishSkillSet':
        newItem = INITIAL_FINISH_SKILL_SET(); // This generates a prefixed ID
        newId = newItem.id;
        setPatchState((prev) => ({
          ...prev,
          finishSkillSets: [...(prev.finishSkillSets || []), newItem as FinishSkillSet],
        }));
        logAnalyticsEvent('add_skill_set', { set_type: 'finishSkillSet', new_set_id: newId });
        break;
      case 'finishSpecial':
        newItem = INITIAL_FINISH_SPECIAL(); // This generates a prefixed ID
        newId = newItem.id;
        setPatchState((prev) => ({
          ...prev,
          finishSpecials: [...(prev.finishSpecials || []), newItem as FinishSpecial],
        }));
        logAnalyticsEvent('add_finish_special', { new_id: newId });
        break;
      case 'battleParam': {
        const existingParamNos = (patchState.battleParams || []).map((p) => p.param_no);
        let nextParamNo = 1;
        while (existingParamNos.includes(nextParamNo)) {
          nextParamNo++;
        }
        const firstBattleParam = INITIAL_BATTLE_PARAM(nextParamNo, 0);
        setPatchState((prev) => ({
          ...prev,
          battleParams: [...(prev.battleParams || []), firstBattleParam],
        }));
        newId = nextParamNo;
        setEditingBattleParamNo(nextParamNo);
        setEditingItemId(null);
        setActiveSection('battleParam');
        logAnalyticsEvent('add_battle_param_set', { param_no: nextParamNo });
        return;
      }
    }
    setActiveSection(type);
    setEditingItemId(newId as DokkanID);
    setEditingBattleParamNo(null);
  };

  const handleDuplicateSet = (
    type: 'standbySkillSet' | 'finishSkillSet' | 'finishSpecial',
    idToDuplicate: DokkanID
  ) => {
    const listKey =
      type === 'standbySkillSet'
        ? 'standbySkillSets'
        : type === 'finishSkillSet'
          ? 'finishSkillSets'
          : 'finishSpecials';
    const originalItem = (
      patchState[listKey] as Array<StandbySkillSet | FinishSkillSet | FinishSpecial>
    ).find((s) => s.id === idToDuplicate);
    if (!originalItem) return;

    const duplicatedItem: any = JSON.parse(JSON.stringify(originalItem));
    const newIdSuffix = generateLocalId();
    let prefix = '';

    if (type === 'standbySkillSet') prefix = ID_PREFIXES.STANDBY_SKILL_SET;
    else if (type === 'finishSkillSet') prefix = ID_PREFIXES.FINISH_SKILL_SET;
    else if (type === 'finishSpecial') prefix = ID_PREFIXES.FINISH_SPECIAL;

    duplicatedItem.id = prefix + newIdSuffix;
    if ('name' in originalItem && originalItem.name) {
      duplicatedItem.name = `Copy of ${originalItem.name}`;
    }

    if (type === 'standbySkillSet' || type === 'finishSkillSet') {
      const skillNameForIdGen = getSkillNameForSectionType(type);

      duplicatedItem.skills = ((originalItem as any).skills || []).map(
        (skill: any, idx: number) => {
          const newSkill = JSON.parse(JSON.stringify(skill));
          newSkill.id = generateNewSkillIdForDuplicatedSet(
            duplicatedItem.id,
            skillNameForIdGen,
            idx,
            skill.id
          );
          // Update skill's own reference to parent set ID
          const parentIdField = Object.keys(newSkill).find((k) => k.endsWith('_set_id')) as
            | keyof typeof newSkill
            | undefined;
          if (parentIdField) {
            (newSkill as any)[parentIdField] = duplicatedItem.id;
          }
          if ('name' in newSkill && typeof (newSkill as { name?: string }).name === 'string') {
            (newSkill as { name: string }).name += ' (Copy)';
          }
          return newSkill;
        }
      );
      // Note: finishSkillSetRelations for StandbySkillSet are NOT automatically duplicated here. They need manual linking.
    }
    logAnalyticsEvent('duplicate_item', {
      item_type: type,
      original_id: originalItem.id,
      new_id: duplicatedItem.id,
    });

    setPatchState((prev) => {
      return {
        ...prev,
        [listKey]: [
          ...(prev[listKey] as Array<StandbySkillSet | FinishSkillSet | FinishSpecial>),
          duplicatedItem,
        ],
      };
    });
  };

  const handleSelect = (type: EditableSection, idOrParamNo: DokkanID | number) => {
    setActiveSection(type);
    if (type === 'battleParam') {
      setEditingBattleParamNo(idOrParamNo as number);
      setEditingItemId(null);
    } else {
      setEditingItemId(idOrParamNo as DokkanID);
      setEditingBattleParamNo(null);
    }
  };

  const handleUpdateItem = <K extends 'standbySkillSets' | 'finishSkillSets' | 'finishSpecials'>(
    listKey: K,
    originalId: DokkanID,
    updatedItem: DokkanPatchState[K][number]
  ) => {
    const newId = updatedItem.id;

    setPatchState((prev) => {
      if (originalId !== newId) {
        let listToCheck: (StandbySkillSet | FinishSkillSet | FinishSpecial)[] = [];
        switch (listKey) {
          case 'standbySkillSets':
            listToCheck = prev.standbySkillSets || [];
            break;
          case 'finishSkillSets':
            listToCheck = prev.finishSkillSets || [];
            break;
          case 'finishSpecials':
            listToCheck = prev.finishSpecials || [];
            break;
        }
        if (listToCheck.some((item) => item.id === newId)) {
          addToast(`Error: ID "${newId}" is already in use in ${listKey}.`, { type: 'error' });
          return prev;
        }
      }
      const newPatchState = { ...prev };

      // 1. Update item in its list
      (newPatchState[listKey] as any[]) = (prev[listKey] as any[]).map((item) =>
        item.id === originalId ? updatedItem : item
      );

      // 2. Cascade if ID changed
      if (originalId !== newId) {
        switch (listKey) {
          case 'standbySkillSets': {
            const updatedStandbySet = updatedItem as StandbySkillSet;
            // Update child skills
            if (updatedStandbySet.skills)
              updatedStandbySet.skills.forEach((skill) => {
                skill.standby_skill_set_id = newId;
              });
            // Update card forms
            newPatchState.cardForms = newPatchState.cardForms.map((form) =>
              form.standby_skill_set_id_ref === originalId
                ? { ...form, standby_skill_set_id_ref: newId }
                : form
            );
            // Update card standby skills (junction)
            newPatchState.cardStandbySkills = (newPatchState.cardStandbySkills || []).map((css) =>
              css.standby_skill_set_id === originalId
                ? { ...css, standby_skill_set_id: newId, id: `${css.card_id}${newId}` }
                : css
            );
            // Update relations to finish sets
            newPatchState.standbySkillSetFinishSkillSetRelations = (
              newPatchState.standbySkillSetFinishSkillSetRelations || []
            ).map((rel) =>
              rel.standby_skill_set_id === originalId
                ? { ...rel, standby_skill_set_id: newId }
                : rel
            );
            break;
          }

          case 'finishSkillSets': {
            const updatedFinishSet = updatedItem as FinishSkillSet;
            // Update child skills
            if (updatedFinishSet.skills)
              updatedFinishSet.skills.forEach((skill) => {
                skill.finish_skill_set_id = newId;
              });
            // Update relations from standby sets
            newPatchState.standbySkillSetFinishSkillSetRelations = (
              newPatchState.standbySkillSetFinishSkillSetRelations || []
            ).map((rel) =>
              rel.finish_skill_set_id === originalId ? { ...rel, finish_skill_set_id: newId } : rel
            );
            break;
          }

          case 'finishSpecials':
            // Update finish skill sets that reference this special
            newPatchState.finishSkillSets = (newPatchState.finishSkillSets || []).map((fs) =>
              fs.finish_special_id === originalId ? { ...fs, finish_special_id: newId } : fs
            );
            break;
        }
      }
      return newPatchState;
    });

    if (originalId !== newId) {
      setEditingItemId(newId);
    }
  };

  const handleUpdateBattleParam = (updatedParam: BattleParam) => {
    setPatchState((prev) => ({
      ...prev,
      battleParams: (prev.battleParams || []).map((bp) =>
        bp.id === updatedParam.id ? updatedParam : bp
      ),
    }));
  };

  const handleAddBattleParamEntry = (param_no: number) => {
    const existingParamsForNo = (patchState.battleParams || []).filter(
      (bp) => bp.param_no === param_no
    );
    const nextIdx =
      existingParamsForNo.length > 0 ? Math.max(...existingParamsForNo.map((bp) => bp.idx)) + 1 : 0;
    const newBattleParam = INITIAL_BATTLE_PARAM(param_no, nextIdx);
    setPatchState((prev) => ({
      ...prev,
      battleParams: [...(prev.battleParams || []), newBattleParam],
    }));
    logAnalyticsEvent('add_battle_param_entry', {
      param_no: param_no,
      new_entry_id: newBattleParam.id,
    });
  };

  const handleRemoveBattleParamEntry = (idToRemove: DokkanID) => {
    setPatchState((prev) => {
      const paramToRemove = (prev.battleParams || []).find((bp) => bp.id === idToRemove);
      if (paramToRemove)
        logAnalyticsEvent('remove_battle_param_entry', {
          param_no: paramToRemove.param_no,
          removed_id: idToRemove,
        });
      return {
        ...prev,
        battleParams: (prev.battleParams || []).filter((bp) => bp.id !== idToRemove),
      };
    });
  };

  const handleRemove = (type: EditableSection, idToRemove: DokkanID | number) => {
    let listKey: keyof DokkanPatchState | null = null;
    switch (type) {
      case 'standbySkillSet':
        listKey = 'standbySkillSets';
        break;
      case 'finishSkillSet':
        listKey = 'finishSkillSets';
        break;
      case 'finishSpecial':
        listKey = 'finishSpecials';
        break;
      case 'battleParam':
        setPatchState((prev) => {
          logAnalyticsEvent('remove_battle_param_set', { param_no_removed: idToRemove });
          return {
            ...prev,
            battleParams: (prev.battleParams || []).filter((bp) => bp.param_no !== idToRemove),
          };
        });
        if (editingBattleParamNo === idToRemove) {
          setEditingBattleParamNo(null);
          setActiveSection(null);
        }
        return;
    }

    if (listKey) {
      const LKey = listKey as keyof Pick<
        DokkanPatchState,
        'standbySkillSets' | 'finishSkillSets' | 'finishSpecials'
      >;
      setPatchState((prev) => {
        logAnalyticsEvent('remove_item', { item_type: type, removed_id: idToRemove });
        return {
          ...prev,
          [LKey]: ((prev[LKey] || []) as Array<{ id: DokkanID }>).filter(
            (item) => item.id !== idToRemove
          ),
        };
      });
      if (editingItemId === idToRemove) {
        setEditingItemId(null);
        setActiveSection(null);
      }
    }
  };

  const handleLinkFinishSet = (standbySetId: DokkanID, finishSetIdToLink: DokkanID) => {
    if (!finishSetIdToLink) return;
    const relationExists = (patchState.standbySkillSetFinishSkillSetRelations || []).some(
      (rel) =>
        rel.standby_skill_set_id === standbySetId && rel.finish_skill_set_id === finishSetIdToLink
    );
    if (relationExists) {
      addToast('This Finish Skill Set is already linked.', { type: 'warning' });
      return;
    }
    const newRelation = INITIAL_STANDBY_SKILL_SET_FINISH_SKILL_SET_RELATION(
      standbySetId,
      finishSetIdToLink
    );
    setPatchState((prev) => ({
      ...prev,
      standbySkillSetFinishSkillSetRelations: [
        ...(prev.standbySkillSetFinishSkillSetRelations || []),
        newRelation,
      ],
    }));
    logAnalyticsEvent('link_finish_set', {
      standby_set_id: standbySetId,
      finish_set_id: finishSetIdToLink,
    });
  };

  const handleUnlinkFinishSet = (relationIdToRemove: DokkanID) => {
    setPatchState((prev) => {
      const relation = (prev.standbySkillSetFinishSkillSetRelations || []).find(
        (r) => r.id === relationIdToRemove
      );
      // Fix: Corrected property access to standby_skill_set_id and finish_skill_set_id, and removed erroneous arithmetic operations on string IDs.
      if (relation)
        logAnalyticsEvent('unlink_finish_set', {
          standby_set_id: relation.standby_skill_set_id,
          finish_set_id: relation.finish_skill_set_id,
        });
      return {
        ...prev,
        standbySkillSetFinishSkillSetRelations: (
          prev.standbySkillSetFinishSkillSetRelations || []
        ).filter((rel) => rel.id !== relationIdToRemove),
      };
    });
  };

  const openImportModalForStandbyFinish = (targetType: 'standbySkillSets' | 'finishSkillSets') => {
    if (!dbInstance) {
      addToast('Please load a database file first to import skills.', { type: 'warning' });
      return;
    }
    setImportTargetType(targetType);
    setShowImportSkillsModal(true);
    logAnalyticsEvent('open_import_modal', {
      target_type: targetType,
      from: 'standby_finish_editor',
    });
  };

  const handleSkillsImportedForStandbyFinish = (importData: {
    type: 'set' | 'skills';
    data: AnySkillSet | AnySkill[];
  }) => {
    if (!editingItemId || !activeSection || !importTargetType) return;
    if (activeSection !== 'standbySkillSet' && activeSection !== 'finishSkillSet') return;

    let expectedImportTargetType: 'standbySkillSets' | 'finishSkillSets';
    if (activeSection === 'standbySkillSet') {
      expectedImportTargetType = 'standbySkillSets';
    } else {
      expectedImportTargetType = 'finishSkillSets';
    }

    if (importTargetType !== expectedImportTargetType) {
      console.error(
        'Mismatched target type for import. Expected:',
        expectedImportTargetType,
        'Got:',
        importTargetType,
        'Based on active section:',
        activeSection
      );
      addToast('Error: Mismatched skill type during import.', { type: 'error' });
      return;
    }

    const listKey = activeSection === 'standbySkillSet' ? 'standbySkillSets' : 'finishSkillSets';

    setPatchState((prev) => {
      const updatedPatchState = { ...prev };
      const targetSetList = [...(updatedPatchState[listKey] || [])] as Array<
        StandbySkillSet | FinishSkillSet
      >;
      const setIndex = targetSetList.findIndex((s) => s.id === editingItemId);

      if (setIndex === -1) {
        console.error('Target set not found for import:', editingItemId);
        addToast('Error: Target skill set not found.', { type: 'error' });
        return prev;
      }

      const currentSetInPatch: StandbySkillSet | FinishSkillSet = { ...targetSetList[setIndex] };

      if (importData.type === 'set') {
        const importedSet = importData.data as AnySkillSet;
        currentSetInPatch.name = importedSet.name ?? '';

        // Fix: Use type guards to ensure type safety when assigning skills and properties.
        if (listKey === 'standbySkillSets' && 'ingame_icon_path' in importedSet) {
          const typedCurrentSet = currentSetInPatch as StandbySkillSet;
          const sourceSet = importedSet as StandbySkillSet; // Cast source
          typedCurrentSet.skills = sourceSet.skills;
          typedCurrentSet.ingame_icon_path = sourceSet.ingame_icon_path;
          typedCurrentSet.effect_description = sourceSet.effect_description;
          typedCurrentSet.condition_description = sourceSet.condition_description;
          typedCurrentSet.exec_limit = sourceSet.exec_limit;
          typedCurrentSet.causality_conditions = sourceSet.causality_conditions;
          typedCurrentSet.special_view_id = sourceSet.special_view_id;
          typedCurrentSet.costume_special_view_id = sourceSet.costume_special_view_id;
          typedCurrentSet.bgm_id = sourceSet.bgm_id;
        } else if (listKey === 'finishSkillSets' && 'dialog_order' in importedSet) {
          const typedCurrentSet = currentSetInPatch as FinishSkillSet;
          const sourceSet = importedSet as FinishSkillSet; // Cast source
          typedCurrentSet.skills = sourceSet.skills;
          typedCurrentSet.effect_description = sourceSet.effect_description;
          typedCurrentSet.condition_description = sourceSet.condition_description;
          typedCurrentSet.dialog_order = sourceSet.dialog_order;
          typedCurrentSet.dialog_images = sourceSet.dialog_images;
          typedCurrentSet.exec_timing_type = sourceSet.exec_timing_type;
          typedCurrentSet.exec_limit = sourceSet.exec_limit;
          typedCurrentSet.causality_conditions = sourceSet.causality_conditions;
          typedCurrentSet.finish_special_id = sourceSet.finish_special_id;
          typedCurrentSet.special_view_id = sourceSet.special_view_id;
          typedCurrentSet.costume_special_view_id = sourceSet.costume_special_view_id;
          typedCurrentSet.bgm_id = sourceSet.bgm_id;
          typedCurrentSet.is_dialog_view_visible = sourceSet.is_dialog_view_visible;
        }
        addToast(
          `Full content of set '${importedSet.name}' imported into current set '${currentSetInPatch.name}' (ID: ${currentSetInPatch.id}).`,
          { type: 'success' }
        );
        // Fix: Corrected logAnalyticsEvent calls to prevent 'unknown' type errors by ensuring all properties are defined and of the correct type (string or number).
        logAnalyticsEvent('import_skill_set_content', {
          set_type: listKey,
          target_set_id: editingItemId!,
          imported_set_id: importedSet.id,
        });
      } else {
        // importData.type === 'skills'
        const importedSkills = importData.data as AnySkill[];
        const skillNameForIdGen = getSkillNameForSectionType(activeSection);

        // Fix: Use type guards to safely append skills to the correct array type, resolving multiple type errors.
        if (listKey === 'standbySkillSets') {
          const typedCurrentSet = currentSetInPatch as StandbySkillSet;
          const newSkillsToAdd = importedSkills.map((importedSkill, idx) => {
            const newSkill = { ...importedSkill } as StandbySkill;
            newSkill.id = generateNewSkillIdForDuplicatedSet(
              typedCurrentSet.id,
              skillNameForIdGen,
              (typedCurrentSet.skills || []).length + idx,
              importedSkill.id
            );
            if ('name' in newSkill && typeof newSkill.name === 'string') {
              newSkill.name += ' (Copy)';
            }
            newSkill.standby_skill_set_id = typedCurrentSet.id;
            return newSkill;
          });
          typedCurrentSet.skills = [...(typedCurrentSet.skills || []), ...newSkillsToAdd];
        } else if (listKey === 'finishSkillSets') {
          const typedCurrentSet = currentSetInPatch as FinishSkillSet;
          const newSkillsToAdd = importedSkills.map((importedSkill, idx) => {
            const newSkill = { ...importedSkill } as FinishSkill;
            newSkill.id = generateNewSkillIdForDuplicatedSet(
              typedCurrentSet.id,
              skillNameForIdGen,
              (typedCurrentSet.skills || []).length + idx,
              importedSkill.id
            );
            if ('name' in newSkill && typeof newSkill.name === 'string') {
              newSkill.name += ' (Copy)';
            }
            newSkill.finish_skill_set_id = typedCurrentSet.id;
            return newSkill;
          });
          typedCurrentSet.skills = [...(typedCurrentSet.skills || []), ...newSkillsToAdd];
        }

        addToast(`${importedSkills.length} skill effects imported and appended to current set.`, { type: 'success' });
        // Fix: Corrected logAnalyticsEvent calls to prevent 'unknown' type errors by ensuring all properties are defined and of the correct type (string or number).
        logAnalyticsEvent('import_skill_effects', {
          set_type: listKey,
          target_set_id: editingItemId!,
          num_effects_imported: importedSkills.length,
        });
      }

      targetSetList[setIndex] = currentSetInPatch;
      (updatedPatchState as any)[listKey] = targetSetList;
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

    // Check if already exists
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

  const renderList = <T extends { id: DokkanID; name?: string }>(
    title: string,
    sectionType: EditableSection,
    items: T[],
    currentEditingIdToListMatch: DokkanID | null
  ) => (
    <div className="card mb-6 p-4">
      <h3 className="text-xl font-bold mb-3 text-[var(--clr-accent)] font-rajdhani">{title}</h3>
      <button
        onClick={() => handleAdd(sectionType)}
        className="mb-3 btn-secondary py-1.5 px-3 rounded-md text-sm"
      >
        <i className="fas fa-plus mr-1.5"></i> Add New
      </button>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item) => (
          <li
            key={item.id}
            className={`p-2.5 rounded-md cursor-pointer flex justify-between items-center transition-all duration-150 ease-in-out shadow-sm hover:shadow-md font-rajdhani text-sm
                          ${activeSection === sectionType && currentEditingIdToListMatch === item.id
                ? 'bg-[var(--clr-primary)] text-white ring-1 ring-[var(--clr-accent)]'
                : 'bg-[var(--clr-bg-card)] hover:bg-[var(--clr-bg-main)]/80 hover:text-[var(--clr-accent)]'
              }`}
            onClick={() => handleSelect(sectionType, item.id)}
          >
            <span className="truncate">
              <span className="font-roboto-mono text-xs opacity-70 mr-1">{item.id}</span> -{' '}
              {item.name || 'Unnamed'}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicateSet(
                    sectionType as 'standbySkillSet' | 'finishSkillSet' | 'finishSpecial',
                    item.id
                  );
                }}
                className="text-[var(--clr-text-accent)] hover:text-[var(--clr-primary)] hover:bg-[var(--clr-primary)]/20 rounded-full p-0.5 px-1.5 text-xs transition-colors"
                title="Duplicate Item"
              >
                <i className="fas fa-copy"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(sectionType, item.id);
                }}
                className="text-[var(--clr-danger)] hover:text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/20 rounded-full p-0.5 px-1.5 text-xs transition-colors"
                title="Remove Item"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[var(--clr-text-muted)] italic">No items yet.</p>
        )}
      </ul>
    </div>
  );

  const renderBattleParamNoList = () => {
    const paramNos = Array.from(
      new Set((patchState.battleParams || []).map((p) => p.param_no))
    ).sort((a, b) => a - b);
    return (
      <div className="card mb-6 p-4">
        <h3 className="text-xl font-bold mb-3 text-[var(--clr-accent)] font-rajdhani">
          Battle Param Sets (by param_no)
        </h3>
        <button
          onClick={() => handleAdd('battleParam')}
          className="mb-3 btn-secondary py-1.5 px-3 rounded-md text-sm"
        >
          <i className="fas fa-plus mr-1.5"></i> Add New Param Set
        </button>
        <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {paramNos.map((paramNo) => (
            <li
              key={paramNo}
              className={`p-2.5 rounded-md cursor-pointer flex justify-between items-center transition-all duration-150 ease-in-out shadow-sm hover:shadow-md font-rajdhani text-sm
                                ${activeSection === 'battleParam' &&
                  editingBattleParamNo === paramNo
                  ? 'bg-[var(--clr-primary)] text-white ring-1 ring-[var(--clr-accent)]'
                  : 'bg-[var(--clr-bg-card)] hover:bg-[var(--clr-bg-main)]/80 hover:text-[var(--clr-accent)]'
                }`}
              onClick={() => handleSelect('battleParam', paramNo)}
            >
              <span>
                Param No: <span className="font-roboto-mono">{paramNo}</span> (
                {(patchState.battleParams || []).filter((p) => p.param_no === paramNo).length}{' '}
                entries)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove('battleParam', paramNo);
                }}
                className="text-[var(--clr-danger)] hover:text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/20 rounded-full p-0.5 px-1.5 text-xs transition-colors"
              >
                <i className="fas fa-trash"></i>
              </button>
            </li>
          ))}
          {paramNos.length === 0 && (
            <p className="text-xs text-[var(--clr-text-muted)] italic">No Battle Param sets yet.</p>
          )}
        </ul>
      </div>
    );
  };

  const renderEditor = () => {
    if (!activeSection || (editingItemId === null && editingBattleParamNo === null)) {
      return (
        <p className="text-center text-[var(--clr-text-muted)] font-rajdhani text-lg italic mt-10">
          Select an item or create a new one to start editing.
        </p>
      );
    }

    let currentItem: StandbySkillSet | FinishSkillSet | FinishSpecial | undefined;
    if (activeSection === 'battleParam' && editingBattleParamNo !== null) {
      // For battle params, we edit the group. Individual params are listed inside.
    } else if (editingItemId !== null) {
      switch (activeSection) {
        case 'standbySkillSet':
          currentItem = (patchState.standbySkillSets || []).find((s) => s.id === editingItemId);
          break;
        case 'finishSkillSet':
          currentItem = (patchState.finishSkillSets || []).find((s) => s.id === editingItemId);
          break;
        case 'finishSpecial':
          currentItem = (patchState.finishSpecials || []).find((s) => s.id === editingItemId);
          break;
      }
    }

    if (activeSection !== 'battleParam' && !currentItem) {
      setEditingItemId(null);
      setActiveSection(null);
      return <p className="text-[var(--clr-danger)]">Error: Selected item not found.</p>;
    }

    const importButton = (targetType: 'standbySkillSets' | 'finishSkillSets') => (
      <button
        onClick={() => openImportModalForStandbyFinish(targetType)}
        disabled={!dbInstance}
        className="btn-secondary py-2 px-4 rounded-md disabled:opacity-50 mt-2 mb-4"
        title={
          !dbInstance ? 'Load DB to enable import' : 'Import skill set content or effects from DB'
        }
      >
        <i className="fas fa-database mr-2"></i> Import from DB
      </button>
    );

    switch (activeSection) {
      case 'standbySkillSet': {
        const ssSet = currentItem as StandbySkillSet;
        const originalSetId = ssSet.id;
        const linkedFinishSets = (patchState.standbySkillSetFinishSkillSetRelations || [])
          .filter((rel) => rel.standby_skill_set_id === ssSet.id)
          .map((rel) => ({
            relationId: rel.id,
            finishSet: (patchState.finishSkillSets || []).find(
              (fs) => fs.id === rel.finish_skill_set_id
            ),
          }))
          .filter((item) => item.finishSet);

        return (
          <div className="card p-5 shadow-xl">
            <h4 className="text-2xl font-bold mb-4 text-[var(--clr-accent)] font-rajdhani">
              Editing Standby Skill Set:{' '}
              <span className="text-[var(--clr-text)]">{ssSet.name}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
              <FormInput
                label="ID"
                value={ssSet.id}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, { ...ssSet, id: val })
                }
                className="font-roboto-mono"
              />
              <FormInput
                label="Name"
                value={ssSet.name}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, { ...ssSet, name: val })
                }
              />
              <FormInput
                label="Ingame Icon Path"
                value={ssSet.ingame_icon_path}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    ingame_icon_path: val,
                  })
                }
              />
              <FormInput
                label="Execution Limit"
                type="number"
                value={ssSet.exec_limit}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    exec_limit: Number(val),
                  })
                }
              />
              <FormInput
                label="Special View ID"
                type="number"
                value={ssSet.special_view_id ?? ''}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    special_view_id: val ? Number(val) : null,
                  })
                }
                placeholder="Optional"
              />
              <FormInput
                label="Costume Special View ID"
                type="number"
                value={ssSet.costume_special_view_id}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    costume_special_view_id: Number(val),
                  })
                }
              />
              <FormInput
                label="BGM ID"
                type="number"
                value={ssSet.bgm_id ?? ''}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    bgm_id: val ? Number(val) : null,
                  })
                }
                placeholder="Optional"
                className="font-roboto-mono"
              />
              <FormTextArea
                label="Effect Description"
                value={ssSet.effect_description}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    effect_description: val,
                  })
                }
                rows={3}
                className="md:col-span-2"
              />
              <FormTextArea
                label="Condition Description"
                value={ssSet.condition_description}
                onChange={(val) =>
                  handleUpdateItem('standbySkillSets', originalSetId, {
                    ...ssSet,
                    condition_description: val,
                  })
                }
                rows={3}
                className="md:col-span-2"
              />
              {settings.enableVisualCausalityEditor ? (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--clr-text-muted)] mb-1">
                    Causality Conditions
                  </label>
                  <CausalityEditor
                    jsonString={ssSet.causality_conditions || ''}
                    onChange={(val) =>
                      handleUpdateItem('standbySkillSets', originalSetId, {
                        ...ssSet,
                        causality_conditions: val || null,
                      })
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
                  value={ssSet.causality_conditions || ''}
                  onChange={(val) =>
                    handleUpdateItem('standbySkillSets', originalSetId, {
                      ...ssSet,
                      causality_conditions: val || null,
                    })
                  }
                  rows={2}
                  className="md:col-span-2 font-roboto-mono"
                />
              )}
            </div>
            {importButton('standbySkillSets')}
            <SkillDetailEditor<StandbySkill>
              skillSetId={ssSet.id}
              skills={ssSet.skills || []}
              updateSkills={(updatedSkills) =>
                handleUpdateItem('standbySkillSets', originalSetId, {
                  ...ssSet,
                  skills: updatedSkills,
                })
              }
              initialSkillFactory={() => INITIAL_STANDBY_SKILL(ssSet.id)}
              skillName="Standby Skill Effect"
              patchState={patchState}
              settings={settings}
              skillCausalities={patchState.skillCausalities || EMPTY_ARRAY}
              onCreateSkillCausality={handleCreateSkillCausality}
              onFetchSkillCausality={handleFetchSkillCausality}
              isDbLoaded={!!dbInstance}
            />
            <div className="mt-6 pt-4 border-t border-[var(--clr-border)]">
              <h5 className="text-lg font-semibold mb-2 text-[var(--clr-accent)] font-rajdhani">
                Link Finish Skill Set
              </h5>
              <div className="flex items-end gap-2 mb-3">
                <SearchableSelect
                  label="Available Finish Skill Sets"
                  value={''}
                  onChange={(val) => handleLinkFinishSet(ssSet.id, String(val))}
                  options={(patchState.finishSkillSets || []).map((fs) => ({
                    label: `${fs.id} - ${fs.name}`,
                    value: fs.id,
                  }))}
                  placeholder="Select Finish Set to Link..."
                  className="flex-grow"
                />
              </div>
              {linkedFinishSets.length > 0 && (
                <p className="text-sm text-[var(--clr-text)] mb-1">Linked Sets:</p>
              )}
              <ul className="space-y-1">
                {linkedFinishSets.map(
                  (link) =>
                    link.finishSet && (
                      <li
                        key={link.relationId}
                        className="flex justify-between items-center text-xs p-1.5 bg-[var(--clr-bg-card)]/30 rounded"
                      >
                        <span>
                          {link.finishSet.id} - {link.finishSet.name}
                        </span>
                        <button
                          onClick={() => handleUnlinkFinishSet(link.relationId)}
                          className="text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-0.5"
                        >
                          <i className="fas fa-unlink"></i>
                        </button>
                      </li>
                    )
                )}
              </ul>
            </div>
          </div>
        );
      }
      case 'finishSkillSet': {
        const fsSet = currentItem as FinishSkillSet;
        const originalSetId = fsSet.id;
        return (
          <div className="card p-5 shadow-xl">
            <h4 className="text-2xl font-bold mb-4 text-[var(--clr-accent)] font-rajdhani">
              Editing Finish Skill Set: <span className="text-[var(--clr-text)]">{fsSet.name}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
              <FormInput
                label="ID"
                value={fsSet.id}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, { ...fsSet, id: val })
                }
                className="font-roboto-mono"
              />
              <FormInput
                label="Name"
                value={fsSet.name}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, { ...fsSet, name: val })
                }
              />
              <FormInput
                label="Dialog Order"
                type="number"
                value={fsSet.dialog_order}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    dialog_order: Number(val),
                  })
                }
              />
              <FormInput
                label="Execution Timing Type"
                type="number"
                value={fsSet.exec_timing_type}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    exec_timing_type: Number(val),
                  })
                }
              />
              <FormInput
                label="Execution Limit"
                type="number"
                value={fsSet.exec_limit}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    exec_limit: Number(val),
                  })
                }
              />
              <SearchableSelect
                label="Finish Special ID"
                value={fsSet.finish_special_id || ''}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    finish_special_id: val ? String(val) : null,
                  })
                }
                options={(patchState.finishSpecials || []).map((fsp) => ({
                  label: `${fsp.id} (Rate: ${fsp.increase_rate})`,
                  value: fsp.id,
                }))}
                className="font-roboto-mono"
                isOptional
              />
              <FormInput
                label="Special View ID"
                type="number"
                value={fsSet.special_view_id ?? ''}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    special_view_id: val ? Number(val) : null,
                  })
                }
                placeholder="Optional"
              />
              <FormInput
                label="Costume Special View ID"
                type="number"
                value={fsSet.costume_special_view_id}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    costume_special_view_id: Number(val),
                  })
                }
              />
              <FormInput
                label="BGM ID"
                type="number"
                value={fsSet.bgm_id ?? ''}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    bgm_id: val ? Number(val) : null,
                  })
                }
                placeholder="Optional"
                className="font-roboto-mono"
              />
              <FormCheckbox
                label="Is Dialog View Visible"
                checked={fsSet.is_dialog_view_visible === 1}
                onChange={(checked) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    is_dialog_view_visible: checked ? 1 : 0,
                  })
                }
              />
              <FormTextArea
                label="Effect Description"
                value={fsSet.effect_description}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    effect_description: val,
                  })
                }
                rows={3}
                className="md:col-span-2"
              />
              <FormTextArea
                label="Condition Description"
                value={fsSet.condition_description}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    condition_description: val,
                  })
                }
                rows={3}
                className="md:col-span-2"
              />
              <FormTextArea
                label="Dialog Images (JSON)"
                value={fsSet.dialog_images || ''}
                onChange={(val) =>
                  handleUpdateItem('finishSkillSets', originalSetId, {
                    ...fsSet,
                    dialog_images: val || undefined,
                  })
                }
                rows={2}
                className="md:col-span-2 font-roboto-mono"
              />
              {settings.enableVisualCausalityEditor ? (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--clr-text-muted)] mb-1">
                    Causality Conditions
                  </label>
                  <CausalityEditor
                    jsonString={fsSet.causality_conditions || ''}
                    onChange={(val) =>
                      handleUpdateItem('finishSkillSets', originalSetId, {
                        ...fsSet,
                        causality_conditions: val || null,
                      })
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
                  value={fsSet.causality_conditions || ''}
                  onChange={(val) =>
                    handleUpdateItem('finishSkillSets', originalSetId, {
                      ...fsSet,
                      causality_conditions: val || null,
                    })
                  }
                  rows={2}
                  className="md:col-span-2 font-roboto-mono"
                />
              )}
            </div>
            {importButton('finishSkillSets')}
            <SkillDetailEditor<FinishSkill>
              skillSetId={fsSet.id}
              skills={fsSet.skills || []}
              updateSkills={(updatedSkills) =>
                handleUpdateItem('finishSkillSets', originalSetId, {
                  ...fsSet,
                  skills: updatedSkills,
                })
              }
              initialSkillFactory={() => INITIAL_FINISH_SKILL(fsSet.id)}
              skillName="Finish Skill Effect"
              patchState={patchState}
              settings={settings}
              skillCausalities={patchState.skillCausalities || EMPTY_ARRAY}
              onCreateSkillCausality={handleCreateSkillCausality}
              onFetchSkillCausality={handleFetchSkillCausality}
              isDbLoaded={!!dbInstance}
            />
          </div>
        );
      }
      case 'finishSpecial': {
        const fSpecial = currentItem as FinishSpecial;
        const originalId = fSpecial.id;
        return (
          <div className="card p-5 shadow-xl">
            <h4 className="text-2xl font-bold mb-4 text-[var(--clr-accent)] font-rajdhani">
              Editing Finish Special: <span className="text-[var(--clr-text)]">{fSpecial.id}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormInput
                label="ID"
                value={fSpecial.id}
                onChange={(val) =>
                  handleUpdateItem('finishSpecials', originalId, { ...fSpecial, id: val })
                }
                className="font-roboto-mono"
              />
              <FormInput
                label="Increase Rate"
                type="number"
                value={fSpecial.increase_rate}
                onChange={(val) =>
                  handleUpdateItem('finishSpecials', originalId, {
                    ...fSpecial,
                    increase_rate: Number(val),
                  })
                }
              />
              <FormInput
                label="Aim Target"
                type="number"
                value={fSpecial.aim_target}
                onChange={(val) =>
                  handleUpdateItem('finishSpecials', originalId, {
                    ...fSpecial,
                    aim_target: Number(val),
                  })
                }
              />
            </div>
          </div>
        );
      }
      case 'battleParam': {
        if (editingBattleParamNo === null) return <p>Select a Battle Param Set number.</p>;
        const currentBattleParams = (patchState.battleParams || [])
          .filter((bp) => bp.param_no === editingBattleParamNo)
          .sort((a, b) => a.idx - b.idx);
        return (
          <div className="card p-5 shadow-xl">
            <h4 className="text-2xl font-bold mb-4 text-[var(--clr-accent)] font-rajdhani">
              Editing Battle Param Set:{' '}
              <span className="text-[var(--clr-text)] font-roboto-mono">
                {editingBattleParamNo}
              </span>
            </h4>
            <button
              onClick={() => handleAddBattleParamEntry(editingBattleParamNo!)}
              className="mb-4 btn-secondary py-1.5 px-3 rounded-md text-sm"
            >
              <i className="fas fa-plus mr-1.5"></i> Add Param Entry
            </button>
            {currentBattleParams.map((param, idx) => (
              <div
                key={param.id}
                className="grid grid-cols-3 gap-x-4 gap-y-2 items-center mb-2 p-2 bg-[var(--clr-bg-card)]/30 rounded"
              >
                <FormInput
                  label={`ID (Row ${idx + 1})`}
                  value={param.id}
                  onChange={(val) => handleUpdateBattleParam({ ...param, id: val })}
                  disabled
                  className="font-roboto-mono text-xs"
                />
                <FormInput
                  label="Index (idx)"
                  type="number"
                  value={param.idx}
                  onChange={(val) => handleUpdateBattleParam({ ...param, idx: Number(val) })}
                />
                <div className="flex items-end">
                  <FormInput
                    label="Value"
                    value={String(param.value)}
                    onChange={(val) =>
                      handleUpdateBattleParam({
                        ...param,
                        value: isNaN(Number(val)) ? val : Number(val),
                      })
                    }
                  />
                  <button
                    onClick={() => handleRemoveBattleParamEntry(param.id)}
                    className="ml-2 btn-danger p-1.5 h-[38px] rounded"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            ))}
            {currentBattleParams.length === 0 && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">
                No parameters in this set yet.
              </p>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
        <div className="md:col-span-1 space-y-4">
          {renderList(
            'Standby Skill Sets',
            'standbySkillSet',
            patchState.standbySkillSets || [],
            editingItemId
          )}
          {renderList(
            'Finish Skill Sets',
            'finishSkillSet',
            patchState.finishSkillSets || [],
            editingItemId
          )}
          {renderList(
            'Finish Specials',
            'finishSpecial',
            patchState.finishSpecials || [],
            editingItemId
          )}
          {renderBattleParamNoList()}
        </div>
        <div className="md:col-span-2">{renderEditor()}</div>
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
          onSkillsImported={handleSkillsImportedForStandbyFinish}
        />
      )}
    </>
  );
};
