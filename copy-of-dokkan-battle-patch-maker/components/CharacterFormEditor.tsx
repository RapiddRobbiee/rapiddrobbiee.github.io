
import React, { useCallback } from 'react';
import { CardForm, DokkanPatchState, DokkanID, CardSpecial, SpecialSet } from '../types';
import { ELEMENT_TYPE_OPTIONS, RARITY_TYPE_OPTIONS, INITIAL_CARD_SPECIAL, generateLocalId } from '../constants';
import { FormInput, FormSelect, FormTextArea, FormCheckbox } from './FormControls';

interface CharacterFormEditorProps {
  formIndex: number;
  cardForm: CardForm;
  updateCardForm: (index: number, updatedForm: CardForm) => void;
  removeCardForm: (index: number) => void;
  patchState: DokkanPatchState; // Changed from allSkillSets to full patchState
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  // openGeminiModal: (taskType: GeminiTaskType, data: any, updater: (text: string) => void) => void; // Gemini disabled
}

export const CharacterFormEditor: React.FC<CharacterFormEditorProps> = ({
  formIndex, cardForm, updateCardForm, removeCardForm, patchState, setPatchState,
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

  // CardSpecial handlers
  const cardSpecialsForThisForm = patchState.cardSpecials.filter(cs => cs.card_id === cardForm.id);

  const handleAddCardSpecial = () => {
    const newCardSpecial = INITIAL_CARD_SPECIAL(cardForm.id);
    setPatchState(prev => ({
      ...prev,
      cardSpecials: [...prev.cardSpecials, newCardSpecial]
    }));
  };

  const handleUpdateCardSpecial = (specialIndexInFilteredList: number, field: keyof CardSpecial, value: any) => {
    const actualIndexInGlobalList = patchState.cardSpecials.findIndex(cs => cs.id === cardSpecialsForThisForm[specialIndexInFilteredList].id);
    if (actualIndexInGlobalList === -1) return;

    setPatchState(prev => ({
      ...prev,
      cardSpecials: prev.cardSpecials.map((cs, i) => 
        i === actualIndexInGlobalList ? { ...cs, [field]: value } : cs
      )
    }));
  };
  
  const handleRemoveCardSpecial = (specialIndexInFilteredList: number) => {
    const idToRemove = cardSpecialsForThisForm[specialIndexInFilteredList].id;
    setPatchState(prev => ({
      ...prev,
      cardSpecials: prev.cardSpecials.filter(cs => cs.id !== idToRemove)
    }));
  };

  return (
    <div className="bg-indigo-800 bg-opacity-30 p-6 rounded-xl shadow-xl mb-8 border border-orange-500 border-opacity-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-orange-400 font-rajdhani">
          Card Form {formIndex + 1} 
          <span className="text-sm text-indigo-300 ml-2 code-text">(ID: {cardForm.id || 'Not Set'})</span>
        </h3>
        {patchState.cardForms.length > 1 && ( // Show remove button if more than one card form exists
           <button onClick={() => removeCardForm(formIndex)} className="text-red-400 hover:text-red-500 transition-colors font-semibold py-1 px-3 rounded-md bg-red-900 bg-opacity-30 hover:bg-opacity-50 border border-red-500">
            <i className="fas fa-trash-alt mr-1"></i> Remove Form
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
        <FormInput label="Special Motion ID" type="number" value={cardForm.special_motion} onChange={(val) => handleChange('special_motion', Number(val))} />
        
        <FormSelect label="Leader Skill Set ID" value={cardForm.leader_skill_set_id} onChange={(val) => handleChange('leader_skill_set_id', val)} 
            options={patchState.leaderSkillSets.map(ls => ({ label: `${ls.id} - ${ls.name}`, value: ls.id }))}
            allowCustom={true} customLabel="Use Custom ID" className="font-roboto-mono"
        />
        <FormSelect label="Passive Skill Set ID" value={cardForm.passive_skill_set_id} onChange={(val) => handleChange('passive_skill_set_id', val)}
            options={patchState.passiveSkillSets.map(ps => ({ label: `${ps.id} - ${ps.name}`, value: ps.id }))}
            allowCustom={true} customLabel="Use Custom ID" className="font-roboto-mono"
        />
        <FormSelect label="Active Skill Set ID (Ref)" value={cardForm.active_skill_set_id_ref || ''} onChange={(val) => handleChange('active_skill_set_id_ref', val)}
            options={patchState.activeSkillSets.map(as => ({ label: `${as.id} - ${as.name}`, value: as.id }))}
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

      {/* Special Attacks Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-semibold text-orange-400 font-rajdhani">Special Attacks (card_specials entries)</h4>
          <button onClick={handleAddCardSpecial} className="bg-green-500 hover:bg-green-600 text-sm text-white font-semibold py-1.5 px-3 rounded-md shadow-sm hover:shadow-md transition-all">
            <i className="fas fa-plus mr-1"></i> Add Special Attack
          </button>
        </div>
        {cardSpecialsForThisForm.length === 0 && <p className="text-sm text-indigo-300 italic">No special attacks defined for this card form.</p>}
        {cardSpecialsForThisForm.map((cs, index) => (
          <div key={cs.id} className="bg-indigo-700 bg-opacity-40 p-4 rounded-lg shadow-md mb-4 border border-indigo-600">
            <div className="flex justify-between items-center mb-3">
              <p className="text-md font-medium text-orange-300 font-rajdhani">Special Attack {index + 1} <span className="text-xs text-indigo-300 font-roboto-mono">(Row ID: {cs.id})</span></p>
              <button onClick={() => handleRemoveCardSpecial(index)} className="text-red-300 hover:text-red-400 text-xs font-semibold py-1 px-2 rounded bg-red-700 bg-opacity-30 hover:bg-opacity-50 transition-colors">
                <i className="fas fa-times mr-1"></i>Remove Special
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <FormInput label="Row ID (card_specials)" value={cs.id} onChange={val => handleUpdateCardSpecial(index, 'id', val)} disabled={!cs.id.startsWith('local_')} className="font-roboto-mono" />
              <FormSelect label="Special Set ID" value={cs.special_set_id} onChange={val => handleUpdateCardSpecial(index, 'special_set_id', val)}
                options={patchState.specialSets.map(ss => ({ label: `${ss.id} - ${ss.name}`, value: ss.id }))}
                allowCustom customLabel="Enter Custom Set ID" className="font-roboto-mono"
              />
              <FormInput label="Style (e.g. Normal, Hyper)" value={cs.style} onChange={val => handleUpdateCardSpecial(index, 'style', val)} />
              <FormInput label="Priority" type="number" value={cs.priority} onChange={val => handleUpdateCardSpecial(index, 'priority', Number(val))} />
              <FormInput label="SA Lvl Start" type="number" value={cs.lv_start} onChange={val => handleUpdateCardSpecial(index, 'lv_start', Number(val))} />
              <FormInput label="Ki Required (eball_num_start)" type="number" value={cs.eball_num_start} onChange={val => handleUpdateCardSpecial(index, 'eball_num_start', Number(val))} />
              <FormInput label="View ID" type="number" value={cs.view_id} onChange={val => handleUpdateCardSpecial(index, 'view_id', Number(val))} />
              <FormInput label="Costume Condition ID" type="number" value={cs.card_costume_condition_id} onChange={val => handleUpdateCardSpecial(index, 'card_costume_condition_id', Number(val))} />
              <FormInput label="Bonus ID 1" type="number" value={cs.special_bonus_id1} onChange={val => handleUpdateCardSpecial(index, 'special_bonus_id1', Number(val))} />
              <FormInput label="Bonus Lvl 1" type="number" value={cs.special_bonus_lv1} onChange={val => handleUpdateCardSpecial(index, 'special_bonus_lv1', Number(val))} />
              {/* Add more fields for bonus_view_id1, special_bonus_id2 etc. if needed */}
              <FormTextArea label="Causality Conditions (JSON)" value={cs.causality_conditions || ''} onChange={val => handleUpdateCardSpecial(index, 'causality_conditions', val || null)} rows={2} className="font-roboto-mono lg:col-span-3 md:col-span-2"/>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};