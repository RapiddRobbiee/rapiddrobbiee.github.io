
import React, { useCallback } from 'react';
import { CardForm, DokkanPatchState, DokkanID, GeminiTaskType } from '../types';
import { ELEMENT_TYPE_OPTIONS, RARITY_TYPE_OPTIONS } from '../constants';
import { FormInput, FormSelect, FormTextArea, FormCheckbox } from './FormControls';

interface CharacterFormEditorProps {
  formIndex: number;
  cardForm: CardForm;
  updateCardForm: (index: number, updatedForm: CardForm) => void;
  removeCardForm: (index: number) => void;
  allSkillSets: DokkanPatchState; // To select existing skill sets
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>; // To update global skill sets if needed
  // openGeminiModal: (taskType: GeminiTaskType, data: any, updater: (text: string) => void) => void; // Gemini disabled
}

export const CharacterFormEditor: React.FC<CharacterFormEditorProps> = ({
  formIndex, cardForm, updateCardForm, removeCardForm, allSkillSets, setPatchState, 
  // openGeminiModal // Gemini disabled
}) => {
  
  const handleChange = useCallback((field: keyof CardForm, value: any) => {
    updateCardForm(formIndex, { ...cardForm, [field]: value });
  }, [cardForm, formIndex, updateCardForm]);

  const handleListChange = useCallback((field: keyof CardForm, itemIndex: number, value: string) => {
    const currentList = (cardForm[field] as string[]) || [];
    const newList = [...currentList];
    newList[itemIndex] = value;
    handleChange(field, newList);
  }, [cardForm, handleChange]);

  const handleCategoryChange = useCallback((itemIndex: number, value: string) => {
    const currentCategories = cardForm.category_ids || [];
    const newCategories = [...currentCategories];
    newCategories[itemIndex] = value;
    handleChange('category_ids', newCategories);
  }, [cardForm.category_ids, handleChange]);

  const addCategory = useCallback(() => {
    const newCategories = [...(cardForm.category_ids || []), ''];
    handleChange('category_ids', newCategories);
  }, [cardForm.category_ids, handleChange]);

  const removeCategory = useCallback((itemIndex: number) => {
    const newCategories = (cardForm.category_ids || []).filter((_, idx) => idx !== itemIndex);
    handleChange('category_ids', newCategories);
  }, [cardForm.category_ids, handleChange]);

  return (
    <div className="bg-indigo-800 bg-opacity-30 p-6 rounded-xl shadow-xl mb-8 border border-orange-500 border-opacity-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-orange-400 font-rajdhani">
          Card Form {formIndex + 1} 
          <span className="text-sm text-indigo-300 ml-2 code-text">(ID: {cardForm.id || 'Not Set'})</span>
        </h3>
        {formIndex > 0 && (
           <button onClick={() => removeCardForm(formIndex)} className="text-red-400 hover:text-red-500 transition-colors font-semibold py-1 px-3 rounded-md bg-red-900 bg-opacity-30 hover:bg-opacity-50 border border-red-500">
            <i className="fas fa-trash-alt mr-1"></i> Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <FormInput label="Card ID" value={cardForm.id} onChange={(val) => handleChange('id', val)} placeholder="e.g., 1062320" type="text" className="font-roboto-mono"/>
        <FormInput label="Name" value={cardForm.name} onChange={(val) => handleChange('name', val)} />
        <FormInput label="Character ID" value={cardForm.character_id} onChange={(val) => handleChange('character_id', val)} className="font-roboto-mono"/>
        <FormInput label="Card Unique Info ID" value={cardForm.card_unique_info_id} onChange={(val) => handleChange('card_unique_info_id', val)} className="font-roboto-mono"/>
        
        <FormInput label="Cost" type="number" value={cardForm.cost} onChange={(val) => handleChange('cost', Number(val))} />
        <FormSelect label="Rarity" value={cardForm.rarity} onChange={(val) => handleChange('rarity', Number(val))} options={RARITY_TYPE_OPTIONS} />
        <FormSelect label="Element" value={cardForm.element} onChange={(val) => handleChange('element', Number(val))} options={ELEMENT_TYPE_OPTIONS} />

        <FormInput label="HP Init" type="number" value={cardForm.hp_init} onChange={(val) => handleChange('hp_init', Number(val))} />
        <FormInput label="HP Max" type="number" value={cardForm.hp_max} onChange={(val) => handleChange('hp_max', Number(val))} />
        <FormInput label="ATK Init" type="number" value={cardForm.atk_init} onChange={(val) => handleChange('atk_init', Number(val))} />
        <FormInput label="ATK Max" type="number" value={cardForm.atk_max} onChange={(val) => handleChange('atk_max', Number(val))} />
        <FormInput label="DEF Init" type="number" value={cardForm.def_init} onChange={(val) => handleChange('def_init', Number(val))} />
        <FormInput label="DEF Max" type="number" value={cardForm.def_max} onChange={(val) => handleChange('def_max', Number(val))} />

        <FormInput label="Max Level" type="number" value={cardForm.lv_max} onChange={(val) => handleChange('lv_max', Number(val))} />
        <FormInput label="Max Skill Level" type="number" value={cardForm.skill_lv_max} onChange={(val) => handleChange('skill_lv_max', Number(val))} />
        <FormInput label="Grow Type" type="number" value={cardForm.grow_type} onChange={(val) => handleChange('grow_type', Number(val))} />
        
        <FormSelect label="Leader Skill Set ID" value={cardForm.leader_skill_set_id} onChange={(val) => handleChange('leader_skill_set_id', val)} 
            options={allSkillSets.leaderSkillSets.map(ls => ({ label: `${ls.id} - ${ls.name}`, value: ls.id }))}
            allowCustom={true} customLabel="Use Custom ID" className="font-roboto-mono"
        />
        <FormSelect label="Passive Skill Set ID" value={cardForm.passive_skill_set_id} onChange={(val) => handleChange('passive_skill_set_id', val)}
            options={allSkillSets.passiveSkillSets.map(ps => ({ label: `${ps.id} - ${ps.name}`, value: ps.id }))}
            allowCustom={true} customLabel="Use Custom ID" className="font-roboto-mono"
        />
        <FormSelect label="Special Set ID (Ref)" value={cardForm.special_set_id_ref} onChange={(val) => handleChange('special_set_id_ref', val)}
            options={allSkillSets.specialSets.map(ss => ({ label: `${ss.id} - ${ss.name}`, value: ss.id }))}
            allowCustom={true} customLabel="Use Custom ID" className="font-roboto-mono"
        />
        <FormInput label="Special View ID" type="number" value={cardForm.special_view_id} onChange={(val) => handleChange('special_view_id', Number(val))} className="font-roboto-mono"/>
        
        <FormSelect label="Active Skill Set ID (Ref)" value={cardForm.active_skill_set_id_ref || ''} onChange={(val) => handleChange('active_skill_set_id_ref', val)}
            options={allSkillSets.activeSkillSets.map(as => ({ label: `${as.id} - ${as.name}`, value: as.id }))}
            allowCustom={true} customLabel="Use Custom ID" isOptional={true} className="font-roboto-mono"
        />
      </div>

      <div className="mt-8">
        <h4 className="text-xl font-semibold mb-3 text-orange-400 font-rajdhani">Link Skills (IDs)</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
          {cardForm.link_skill_ids.map((linkId, idx) => (
            <FormInput key={idx} label={`Link ${idx + 1}`} value={linkId} onChange={(val) => handleListChange('link_skill_ids', idx, val)} placeholder="Link ID" className="font-roboto-mono"/>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
            <h4 className="text-xl font-semibold text-orange-400 font-rajdhani">Categories (IDs)</h4>
            <button onClick={addCategory} className="bg-blue-500 hover:bg-blue-600 text-sm text-white font-semibold py-1 px-3 rounded-md shadow-sm hover:shadow-md transition-all">
                <i className="fas fa-plus mr-1"></i> Add Category
            </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
          {(cardForm.category_ids || []).map((catId, idx) => (
            <div key={idx} className="flex items-center">
              <FormInput label={`Cat. ${idx + 1}`} value={catId} onChange={(val) => handleCategoryChange(idx, val)} placeholder="Category ID" className="font-roboto-mono flex-grow"/>
              <button onClick={() => removeCategory(idx)} className="ml-2 text-red-400 hover:text-red-500 text-xs p-1 bg-red-900 bg-opacity-20 hover:bg-opacity-40 rounded-full transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
