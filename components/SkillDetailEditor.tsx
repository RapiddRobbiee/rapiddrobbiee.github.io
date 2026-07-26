import React from 'react';
// Fix: Add StandbySkill and FinishSkill to imports and SkillType definition
import {
  DokkanID,
  PassiveSkill,
  LeaderSkill,
  Special,
  ActiveSkillEffect,
  StandbySkill,
  FinishSkill,
  GeminiTaskType,
  AnySkill,
  AppSettings,
  DokkanPatchState,
} from '../types';
import { CausalityEditor } from './CausalityEditor';
import { FormInput, FormSelect, FormTextArea, FormCheckbox } from './FormControls';
import {
  CALC_OPTION_OPTIONS,
  EFFICACY_TYPE_OPTIONS,
  TARGET_TYPE_OPTIONS,
  EXEC_TIMING_TYPE_OPTIONS,
  isLocallyGeneratedId,
  generateLocalId,
} from '../constants';
import { useToast } from '../context/ToastContext';
import { logAnalyticsEvent } from '../services/analyticsService';
import { SearchableSelect } from './SearchableSelect';

// Fix: Add StandbySkill and FinishSkill to the SkillType union
type SkillType =
  | PassiveSkill
  | LeaderSkill
  | Special
  | ActiveSkillEffect
  | StandbySkill
  | FinishSkill;

interface SkillDetailEditorProps<T extends SkillType & { id: DokkanID; name?: string }> {
  skillSetId: DokkanID;
  skills: T[];
  updateSkills: (updatedSkills: T[]) => void;
  initialSkillFactory: () => T;
  skillName: string;
  patchState: DokkanPatchState;
  settings: AppSettings;
  skillCausalities?: any[];
  onCreateSkillCausality?: (
    causality_type: number,
    cau_val1: number | string,
    cau_val2: number | string,
    cau_val3: number | string
  ) => Promise<DokkanID>;
  isDbLoaded?: boolean;
  onFetchSkillCausality?: (id: DokkanID) => Promise<void>;
}

export const SkillDetailEditor = <T extends SkillType & { id: DokkanID; name?: string }>({
  skillSetId,
  skills,
  updateSkills,
  initialSkillFactory,
  skillName,
  patchState,
  settings,
  onCreateSkillCausality,
  isDbLoaded = false,
  onFetchSkillCausality,
}: SkillDetailEditorProps<T>) => {
  const { addToast } = useToast();
  const generateNewSkillId = (
    baseSetId: DokkanID,
    currentSkillName: string,
    newSkillIndex: number,
    originalSkillId?: DokkanID
  ): DokkanID => {
    const baseSetIdNumStr = String(baseSetId).replace(/\D/g, '');
    const isBaseSetIdEffectivelyNumeric = baseSetIdNumStr.length > 0;
    const baseSetIdToUse = isBaseSetIdEffectivelyNumeric ? baseSetIdNumStr : baseSetId;

    if (currentSkillName === 'Passive Effect' || currentSkillName === 'Special Effect') {
      return newSkillIndex === 0
        ? String(baseSetIdToUse)
        : String(newSkillIndex * 100) + String(baseSetIdToUse);
    } else if (currentSkillName === 'Leader Skill Effect') {
      return String(baseSetIdToUse) + String(newSkillIndex).padStart(2, '0');
    } else if (currentSkillName === 'Active Skill Effect') {
      return String(baseSetIdToUse) + String(newSkillIndex + 1);
    } else if (
      currentSkillName === 'Standby Skill Effect' ||
      currentSkillName === 'Finish Skill Effect'
    ) {
      // For Standby/Finish, their skill IDs are often just unique local IDs not strictly tied to parent numeric structure.
      // But to avoid collision on duplication, ensure it's new.
      return generateLocalId();
    }
    // Fallback if skillName doesn't match known patterns, or for safety
    return generateLocalId();
  };

  const handleAddSkill = () => {
    const newSkill = initialSkillFactory();
    const newIndex = skills.length;
    newSkill.id = generateNewSkillId(skillSetId, skillName, newIndex);

    if (
      'name' in newSkill &&
      !newSkill.name &&
      skills.length > 0 &&
      'name' in skills[0] &&
      skills[0].name
    ) {
      newSkill.name = skills[0].name;
    } else if ('name' in newSkill && !newSkill.name) {
      newSkill.name = `${skillName} Detail for ${skillSetId}`;
    }

    if (
      'description' in newSkill &&
      !(newSkill as PassiveSkill).description &&
      skills.length > 0 &&
      'description' in skills[0] &&
      (skills[0] as PassiveSkill).description
    ) {
      (newSkill as PassiveSkill).description = (skills[0] as PassiveSkill).description;
    } else if ('description' in newSkill && !(newSkill as PassiveSkill).description) {
      (newSkill as PassiveSkill).description = `Detail for ${skillSetId}`;
    }

    updateSkills([...skills, newSkill]);
    logAnalyticsEvent('add_skill_effect', {
      skill_set_id: skillSetId,
      skill_type: skillName,
      new_skill_id: newSkill.id,
    });
  };

  const handleDuplicateSkill = (indexToDuplicate: number) => {
    const originalSkill = skills[indexToDuplicate];
    if (!originalSkill) return;

    const duplicatedSkill: T = JSON.parse(JSON.stringify(originalSkill)); // Deep copy

    const newIndex = skills.length; // Will be added at the end
    duplicatedSkill.id = generateNewSkillId(skillSetId, skillName, newIndex, originalSkill.id);

    if ('name' in duplicatedSkill && duplicatedSkill.name) {
      duplicatedSkill.name = `${duplicatedSkill.name} (Copy)`;
    } else if ('name' in duplicatedSkill) {
      duplicatedSkill.name = `${skillName} Detail for ${skillSetId} (Copy)`;
    }

    if ('description' in duplicatedSkill && (duplicatedSkill as PassiveSkill).description) {
      (duplicatedSkill as PassiveSkill).description =
        `${(duplicatedSkill as PassiveSkill).description} (Copy)`;
    } else if ('description' in duplicatedSkill) {
      (duplicatedSkill as PassiveSkill).description = `Detail for ${skillSetId} (Copy)`;
    }

    // Ensure parent set ID is correctly set if the skill type stores it (e.g. active_skill_set_id)
    const parentIdField = Object.keys(duplicatedSkill).find((k) => k.endsWith('_set_id')) as
      | keyof T
      | undefined;
    if (parentIdField && initialSkillFactory()[parentIdField]) {
      (duplicatedSkill as any)[parentIdField] = skillSetId;
    }

    updateSkills([...skills, duplicatedSkill]);
    logAnalyticsEvent('duplicate_item', {
      item_type: 'skill_effect',
      original_id: originalSkill.id,
      new_id: duplicatedSkill.id,
      skill_set_id: skillSetId,
      skill_name: skillName,
    });
  };

  const handleUpdateSkill = (index: number, field: keyof T, value: any) => {
    if (field === 'id') {
      const newId = String(value);
      const originalId = skills[index].id;
      if (newId !== originalId) {
        let allSkillsOfType: AnySkill[] = [];
        switch (skillName) {
          case 'Passive Effect':
            allSkillsOfType = (patchState.passiveSkillSets || []).flatMap((s) => s.skills);
            break;
          case 'Leader Skill Effect':
            allSkillsOfType = (patchState.leaderSkillSets || []).flatMap((s) => s.skills);
            break;
          case 'Special Effect':
            allSkillsOfType = (patchState.specialSets || []).flatMap((s) => s.skills);
            break;
          case 'Active Skill Effect':
            allSkillsOfType = (patchState.activeSkillSets || []).flatMap((s) => s.skills);
            break;
          case 'Standby Skill Effect':
            allSkillsOfType = (patchState.standbySkillSets || []).flatMap((s) => s.skills);
            break;
          case 'Finish Skill Effect':
            allSkillsOfType = (patchState.finishSkillSets || []).flatMap((s) => s.skills);
            break;
        }
        if (allSkillsOfType.some((s) => s.id === newId)) {
          addToast(`Error: ${skillName} ID "${newId}" is already in use.`, { type: 'error' });
          return; // Abort update
        }
      }
    }
    const updatedSkills = skills.map((skill, i) =>
      i === index ? { ...skill, [field]: value } : skill
    );
    updateSkills(updatedSkills);
  };

  const handleRemoveSkill = (index: number) => {
    const skillToRemove = skills[index];
    updateSkills(skills.filter((_, i) => i !== index));
    logAnalyticsEvent('remove_skill_effect', {
      skill_set_id: skillSetId,
      skill_id_removed: skillToRemove.id,
      skill_type: skillName,
    });
  };

  const renderGenericFields = (skill: T, index: number, isPassiveCompact: boolean) => (
    <>
      <FormInput
        label="Effect ID"
        value={skill.id}
        onChange={(val) => handleUpdateSkill(index, 'id' as keyof T, val)}
        className="font-roboto-mono"
      />
      {'name' in skill && (
        <FormInput
          label="Effect Name (Internal)"
          value={skill.name || ''}
          onChange={(val) => handleUpdateSkill(index, 'name' as keyof T, val)}
        />
      )}
      {'description' in skill && (
        <FormInput
          label="Effect Description (Internal)"
          value={(skill as PassiveSkill).description || ''}
          onChange={(val) => handleUpdateSkill(index, 'description' as keyof T, val)}
        />
      )}

      <div className={isPassiveCompact ? 'flex flex-col' : ''}>
        <SearchableSelect
          label="Efficacy Type"
          value={(skill as { efficacy_type: number }).efficacy_type}
          onChange={(val) => handleUpdateSkill(index, 'efficacy_type' as keyof T, Number(val))}
          options={EFFICACY_TYPE_OPTIONS}
        />
      </div>

      <FormInput
        label="Eff Value 1"
        value={(skill as { eff_value1?: any }).eff_value1 ?? ''}
        onChange={(val) => handleUpdateSkill(index, 'eff_value1' as keyof T, val)}
      />
      <FormInput
        label="Eff Value 2"
        value={(skill as { eff_value2?: any }).eff_value2 ?? ''}
        onChange={(val) => handleUpdateSkill(index, 'eff_value2' as keyof T, val)}
      />
      <FormInput
        label="Eff Value 3"
        value={(skill as { eff_value3?: any }).eff_value3 ?? ''}
        onChange={(val) => handleUpdateSkill(index, 'eff_value3' as keyof T, val)}
      />
      {'efficacy_values' in skill && (
        <FormInput
          label="Efficacy Values (JSON)"
          value={
            (skill as LeaderSkill | PassiveSkill | ActiveSkillEffect | StandbySkill | FinishSkill)
              .efficacy_values || '{}'
          }
          onChange={(val) => handleUpdateSkill(index, 'efficacy_values' as keyof T, val)}
          className="font-roboto-mono"
        />
      )}

      <SearchableSelect
        label="Target Type"
        value={(skill as { target_type: number }).target_type}
        onChange={(val) => handleUpdateSkill(index, 'target_type' as keyof T, Number(val))}
        options={TARGET_TYPE_OPTIONS}
      />
      <FormSelect
        label="Calc Option"
        value={(skill as { calc_option: any }).calc_option ?? ''}
        onChange={(val) =>
          handleUpdateSkill(index, 'calc_option' as keyof T, val === '' ? null : Number(val))
        }
        options={CALC_OPTION_OPTIONS}
      />

      {'exec_timing_type' in skill && (
        <SearchableSelect
          label="Exec Timing Type"
          value={(skill as PassiveSkill | LeaderSkill).exec_timing_type}
          onChange={(val) => handleUpdateSkill(index, 'exec_timing_type' as keyof T, Number(val))}
          options={EXEC_TIMING_TYPE_OPTIONS}
        />
      )}
      {'turn' in skill && (
        <FormInput
          label="Turn Duration"
          type="number"
          value={(skill as PassiveSkill | Special | StandbySkill | FinishSkill).turn}
          onChange={(val) => handleUpdateSkill(index, 'turn' as keyof T, Number(val))}
        />
      )}

      {'probability' in skill && (
        <FormInput
          label="Probability (%)"
          type="number"
          value={(skill as PassiveSkill).probability}
          onChange={(val) => handleUpdateSkill(index, 'probability' as keyof T, Number(val))}
          min={0}
          max={100}
        />
      )}
      {'prob' in skill && (
        <FormInput
          label="Probability (%)"
          type="number"
          value={(skill as Special).prob}
          onChange={(val) => handleUpdateSkill(index, 'prob' as keyof T, Number(val))}
          min={0}
          max={100}
        />
      )}

      {'is_once' in skill && (
        <FormCheckbox
          label="Is Once Only"
          checked={(skill as PassiveSkill).is_once === 1}
          onChange={(checked) => handleUpdateSkill(index, 'is_once' as keyof T, checked ? 1 : 0)}
        />
      )}

      <FormInput
        label="Sub Target Type Set ID"
        value={(skill as { sub_target_type_set_id?: DokkanID | null }).sub_target_type_set_id || ''}
        onChange={(val) =>
          handleUpdateSkill(index, 'sub_target_type_set_id' as keyof T, val || null)
        }
        className="font-roboto-mono"
      />

      {'passive_skill_effect_id' in skill && (
        <FormInput
          label="Passive Skill Effect ID"
          value={(skill as PassiveSkill).passive_skill_effect_id || ''}
          onChange={(val) =>
            handleUpdateSkill(index, 'passive_skill_effect_id' as keyof T, val || null)
          }
          className="font-roboto-mono"
        />
      )}

      <div className={isPassiveCompact ? 'lg:col-span-3 md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-[var(--clr-text-muted)] mb-1">
          Causality Conditions
        </label>
        {settings.enableVisualCausalityEditor ? (
          <CausalityEditor
            jsonString={(skill as { causality_conditions?: string | null }).causality_conditions || ''}
            onChange={(val) =>
              handleUpdateSkill(index, 'causality_conditions' as keyof T, val || null)
            }
            skillCausalities={patchState.skillCausalities || []}
            onCreateSkillCausality={onCreateSkillCausality}
            isDbLoaded={isDbLoaded}
            onFetchSkillCausality={onFetchSkillCausality}
          />
        ) : (
          <FormTextArea
            label=""
            value={(skill as { causality_conditions?: string | null }).causality_conditions || ''}
            onChange={(val) =>
              handleUpdateSkill(index, 'causality_conditions' as keyof T, val || null)
            }
            className="font-roboto-mono"
            rows={3}
            placeholder='{"source":"","compiled":[]}'
          />
        )}
      </div>
      {/* Fields specific to StandbySkill or FinishSkill if they exist in their types */}
      {'target_type_values' in skill && (
        <FormInput
          label="Target Type Values (JSON)"
          value={(skill as StandbySkill | FinishSkill).target_type_values || '{}'}
          onChange={(val) => handleUpdateSkill(index, 'target_type_values' as keyof T, val)}
          className="font-roboto-mono"
        />
      )}
      {'thumb_effect_id' in skill && (
        <FormInput
          label="Thumb Effect ID"
          value={(skill as ActiveSkillEffect | StandbySkill | FinishSkill).thumb_effect_id || ''}
          onChange={(val) => handleUpdateSkill(index, 'thumb_effect_id' as keyof T, val || null)}
          className="font-roboto-mono"
        />
      )}
      {'effect_se_id' in skill && (
        <FormInput
          label="Effect SE ID"
          value={(skill as ActiveSkillEffect | StandbySkill | FinishSkill).effect_se_id || ''}
          onChange={(val) => handleUpdateSkill(index, 'effect_se_id' as keyof T, val || null)}
          className="font-roboto-mono"
        />
      )}
    </>
  );

  const isPassiveCompact = skillName === 'Passive Effect';

  return (
    <div className="mt-6">
      <h5 className="text-xl font-semibold mb-3 text-[var(--clr-accent)] font-rajdhani">
        {skillName} Details:
      </h5>
      {skills.map((skill, index) => (
        <div key={skill.id || index} className="mb-6 p-4 card-inset rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-3">
            <p className="text-md font-medium text-[var(--clr-accent)] font-rajdhani">
              {skillName} {index + 1}{' '}
              <span className="text-xs text-[var(--clr-text-muted)] font-roboto-mono">
                (ID: {skill.id})
              </span>
            </p>
            <div className="flex space-x-2">
              <button onClick={() => handleDuplicateSkill(index)} className="btn-secondary-sm">
                <i className="fas fa-copy mr-1"></i>Duplicate
              </button>
              <button onClick={() => handleRemoveSkill(index)} className="btn-danger-sm">
                <i className="fas fa-times mr-1"></i>Remove
              </button>
            </div>
          </div>
          <div
            className={`grid gap-x-6 gap-y-3 ${isPassiveCompact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}
          >
            {renderGenericFields(skill, index, isPassiveCompact)}
            {skillName === 'Special Effect' && (
              <FormInput
                label="Type (e.g. Special::NormalEfficacySpecial)"
                value={(skill as Special).type}
                onChange={(val) => handleUpdateSkill(index, 'type' as keyof T, val)}
              />
            )}
            {/* ActiveSkillEffect specific fields are already covered by thumb_effect_id and effect_se_id in renderGenericFields if they are part of ActiveSkillEffect type */}
          </div>
        </div>
      ))}
      {skills.length === 0 && (
        <p className="text-sm text-[var(--clr-text-muted)] italic">No effects added yet.</p>
      )}
      <button onClick={handleAddSkill} className="btn-primary text-sm py-2 px-4">
        <i className="fas fa-plus mr-2"></i> Add {skillName} Effect
      </button>
    </div>
  );
};
