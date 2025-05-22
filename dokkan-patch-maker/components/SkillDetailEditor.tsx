
import React from 'react';
import { DokkanID, PassiveSkill, LeaderSkill, Special, ActiveSkillEffect, GeminiTaskType } from '../types';
import { FormInput, FormSelect, FormTextArea, FormCheckbox } from './FormControls';
import { CALC_OPTION_OPTIONS, EFFICACY_TYPE_OPTIONS, TARGET_TYPE_OPTIONS, EXEC_TIMING_TYPE_OPTIONS } from '../constants'; // Removed generateLocalId as it's not used directly here for new skill IDs

type SkillType = PassiveSkill | LeaderSkill | Special | ActiveSkillEffect;

interface SkillDetailEditorProps<T extends SkillType & { id: DokkanID, name?: string }> {
  skillSetId: DokkanID;
  skills: T[];
  updateSkills: (updatedSkills: T[]) => void;
  initialSkillFactory: () => T;
  skillName: string; // e.g., "Passive Effect", "Leader Skill Effect"
  // openGeminiModal: (taskType: GeminiTaskType, data: any, updater: (text: string) => void) => void; // Gemini disabled
}

export const SkillDetailEditor = <T extends SkillType & { id: DokkanID, name?: string }>(
  { skillSetId, skills, updateSkills, initialSkillFactory, skillName, 
    // openGeminiModal // Gemini disabled
   }: SkillDetailEditorProps<T>
) => {

  const handleAddSkill = () => {
    const newSkill = initialSkillFactory();
    const currentIndex = skills.length; // Index before adding the new skill

    // Generate patterned ID based on skillName (which implies type)
    if (skillName === "Passive Effect" || skillName === "Special Effect") {
      if (currentIndex === 0) {
        newSkill.id = String(skillSetId);
      } else {
        newSkill.id = String(currentIndex * 100) + String(skillSetId);
      }
    } else if (skillName === "Leader Skill Effect") {
      newSkill.id = String(skillSetId) + String(currentIndex).padStart(2, '0');
    } else if (skillName === "Active Skill Effect") {
      newSkill.id = String(skillSetId) + String(currentIndex + 1);
    } else {
      // Fallback for any other unforeseen skill types, though unlikely with current structure
      newSkill.id = `${skillSetId}_effect_${currentIndex}_${Date.now()}`; 
    }
    
    // For passive skills, copy name and description from set if not set
    if ('name' in newSkill && !newSkill.name && skills.length > 0 && 'name' in skills[0]) {
        newSkill.name = (skills[0] as any).name || `${skillName} Detail`;
    }
    if ('description' in newSkill && !newSkill.description && skills.length > 0 && 'description' in skills[0]) {
         newSkill.description = (skills[0] as any).description || `Detail for ${skillSetId}`;
    }
    updateSkills([...skills, newSkill]);
  };

  const handleUpdateSkill = (index: number, field: keyof T, value: any) => {
    const updatedSkills = skills.map((skill, i) => 
      i === index ? { ...skill, [field]: value } : skill
    );
    updateSkills(updatedSkills);
  };

  const handleRemoveSkill = (index: number) => {
    updateSkills(skills.filter((_, i) => i !== index));
  };
  
  const renderGenericFields = (skill: T, index: number, isPassiveCompact: boolean) => (
    <>
      <FormInput 
        label="Effect ID" 
        value={skill.id} 
        onChange={(val) => handleUpdateSkill(index, 'id' as keyof T, val)} 
        disabled={!String(skill.id).startsWith('local_')} // Ensure skill.id is treated as string
        className="font-roboto-mono"
      />
      {'name' in skill && <FormInput label="Effect Name (Internal)" value={skill.name || ''} onChange={(val) => handleUpdateSkill(index, 'name' as keyof T, val)} />}
      {'description' in skill && <FormInput label="Effect Description (Internal)" value={(skill as PassiveSkill).description || ''} onChange={(val) => handleUpdateSkill(index, 'description' as keyof T, val)} />}

      <div className={isPassiveCompact ? "flex flex-col" : ""}>
        <FormSelect label="Efficacy Type" value={(skill as {efficacy_type: number}).efficacy_type} onChange={(val) => handleUpdateSkill(index, 'efficacy_type' as keyof T, Number(val))} options={EFFICACY_TYPE_OPTIONS} />
        {/* Gemini button disabled */}
        {/* <button onClick={() => openGeminiModal(GeminiTaskType.SUGGEST_EFFICACY_TYPE, (skill as {efficacy_type: number}).efficacy_type, (text) => handleUpdateSkill(index, 'efficacy_type' as keyof T, Number(text)))}
              className="text-xs text-blue-300 hover:text-blue-200 mt-1 self-start font-semibold">
              <i className="fas fa-magic mr-1"></i> Suggest Efficacy
        </button> */}
      </div>

      <FormInput label="Eff Value 1" value={(skill as {eff_value1?: any}).eff_value1 ?? ''} onChange={(val) => handleUpdateSkill(index, 'eff_value1' as keyof T, val)} />
      <FormInput label="Eff Value 2" value={(skill as {eff_value2?: any}).eff_value2 ?? ''} onChange={(val) => handleUpdateSkill(index, 'eff_value2' as keyof T, val)} />
      <FormInput label="Eff Value 3" value={(skill as {eff_value3?: any}).eff_value3 ?? ''} onChange={(val) => handleUpdateSkill(index, 'eff_value3' as keyof T, val)} />
       {'efficacy_values' in skill && <FormInput label="Efficacy Values (JSON)" value={(skill as LeaderSkill | PassiveSkill | ActiveSkillEffect).efficacy_values || '{}'} onChange={(val) => handleUpdateSkill(index, 'efficacy_values' as keyof T, val)} className="font-roboto-mono"/>}


      <FormSelect label="Target Type" value={(skill as {target_type: number}).target_type} onChange={(val) => handleUpdateSkill(index, 'target_type' as keyof T, Number(val))} options={TARGET_TYPE_OPTIONS} />
      <FormSelect label="Calc Option" value={(skill as {calc_option: number}).calc_option} onChange={(val) => handleUpdateSkill(index, 'calc_option' as keyof T, Number(val))} options={CALC_OPTION_OPTIONS} />

      {'exec_timing_type' in skill && <FormSelect label="Exec Timing Type" value={(skill as PassiveSkill | LeaderSkill).exec_timing_type} onChange={(val) => handleUpdateSkill(index, 'exec_timing_type' as keyof T, Number(val))} options={EXEC_TIMING_TYPE_OPTIONS} />}
      {'turn' in skill && <FormInput label="Turn Duration" type="number" value={(skill as PassiveSkill | Special).turn} onChange={(val) => handleUpdateSkill(index, 'turn' as keyof T, Number(val))} />}
      
      {'probability' in skill && <FormInput label="Probability (%)" type="number" value={(skill as PassiveSkill).probability} onChange={(val) => handleUpdateSkill(index, 'probability' as keyof T, Number(val))} min={0} max={100} />}
      {'prob' in skill && <FormInput label="Probability (%)" type="number" value={(skill as Special).prob} onChange={(val) => handleUpdateSkill(index, 'prob' as keyof T, Number(val))} min={0} max={100} />}


      {'is_once' in skill && <FormCheckbox label="Is Once Only" checked={(skill as PassiveSkill).is_once === 1} onChange={(checked) => handleUpdateSkill(index, 'is_once' as keyof T, checked ? 1 : 0)} />}
      
      <FormInput label="Sub Target Type Set ID" value={(skill as {sub_target_type_set_id?: DokkanID | null}).sub_target_type_set_id || ''} onChange={(val) => handleUpdateSkill(index, 'sub_target_type_set_id' as keyof T, val || null)} className="font-roboto-mono"/>
      
      {'passive_skill_effect_id' in skill && <FormInput label="Passive Skill Effect ID" value={(skill as PassiveSkill).passive_skill_effect_id || ''} onChange={(val) => handleUpdateSkill(index, 'passive_skill_effect_id' as keyof T, val || null)} className="font-roboto-mono"/>}
      
      <div className={isPassiveCompact ? "lg:col-span-3 md:col-span-2" : ""}> {/* Causality spans more width in compact mode */}
        <FormTextArea label="Causality Conditions (JSON)" value={(skill as {causality_conditions?: string | null}).causality_conditions || ''} 
          onChange={(val) => handleUpdateSkill(index, 'causality_conditions' as keyof T, val || null)} rows={isPassiveCompact ? 2 : 3} className="font-roboto-mono"/>
        {/* Gemini button disabled */}
        {/* <button onClick={() => openGeminiModal(GeminiTaskType.SUGGEST_CAUSALITY_JSON, (skill as {causality_conditions?: string | null}).causality_conditions, (text) => handleUpdateSkill(index, 'causality_conditions' as keyof T, text))}
              className="text-xs text-blue-300 hover:text-blue-200 mt-1 self-start font-semibold">
              <i className="fas fa-magic mr-1"></i> Suggest JSON
        </button> */}
      </div>
    </>
  );

  const isPassiveCompact = skillName === "Passive Effect";

  return (
    <div className="mt-6">
      <h5 className="text-xl font-semibold mb-3 text-orange-300 font-rajdhani">{skillName} Details:</h5>
      {skills.map((skill, index) => (
        <div key={skill.id || index} className="mb-6 p-4 bg-indigo-700 bg-opacity-40 rounded-lg shadow-md border border-indigo-600">
          <div className="flex justify-between items-center mb-3">
            <p className="text-md font-medium text-orange-300 font-rajdhani">{skillName} {index + 1} <span className="text-xs text-indigo-300 font-roboto-mono">(ID: {skill.id})</span></p>
            <button onClick={() => handleRemoveSkill(index)} className="text-red-300 hover:text-red-400 text-xs font-semibold py-1 px-2 rounded bg-red-700 bg-opacity-30 hover:bg-opacity-50 transition-colors">
              <i className="fas fa-times mr-1"></i>Remove Effect
            </button>
          </div>
          <div className={`grid gap-x-6 gap-y-3 ${isPassiveCompact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {renderGenericFields(skill, index, isPassiveCompact)}
            {/* Specific fields based on T can be added here */}
            {skillName === "Special Effect" && (
                 <FormInput label="Type (e.g. Special::NormalEfficacySpecial)" value={(skill as Special).type} onChange={(val) => handleUpdateSkill(index, 'type' as keyof T, val)} />
            )}
            {skillName === "Active Skill Effect" && (
                <>
                 <FormInput label="Thumb Effect ID" type="number" value={(skill as ActiveSkillEffect).thumb_effect_id || ''} onChange={(val) => handleUpdateSkill(index, 'thumb_effect_id' as keyof T, val ? Number(val) : null)} className="font-roboto-mono"/>
                 <FormInput label="Effect SE ID" type="number" value={(skill as ActiveSkillEffect).effect_se_id || ''} onChange={(val) => handleUpdateSkill(index, 'effect_se_id' as keyof T, val ? Number(val) : null)} className="font-roboto-mono"/>
                </>
            )}
          </div>
        </div>
      ))}
       {skills.length === 0 && <p className="text-sm text-indigo-300 italic">No effects added yet.</p>}
      <button onClick={handleAddSkill} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md text-sm shadow-md hover:shadow-lg transition-all">
        <i className="fas fa-plus mr-2"></i> Add {skillName} Effect
      </button>
    </div>
  );
};
