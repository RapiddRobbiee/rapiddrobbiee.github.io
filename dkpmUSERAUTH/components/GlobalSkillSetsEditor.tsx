
import React, { useState, useCallback } from 'react';
import { DokkanPatchState, PassiveSkillSet, LeaderSkillSet, SpecialSet, ActiveSkillSet, PassiveSkill, LeaderSkill, Special, ActiveSkillEffect, GeminiTaskType, DokkanID } from '../types';
import { INITIAL_PASSIVE_SKILL, INITIAL_LEADER_SKILL, INITIAL_SPECIAL_SKILL, INITIAL_ACTIVE_SKILL_EFFECT, generateLocalId, isLocallyGeneratedId } from '../constants';
import { FormInput, FormTextArea, FormSelect } from './FormControls';
import { SkillDetailEditor } from './SkillDetailEditor';

interface GlobalSkillSetsEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
}

type SkillSetType = 'passiveSkillSets' | 'leaderSkillSets' | 'specialSets' | 'activeSkillSets';

export const GlobalSkillSetsEditor: React.FC<GlobalSkillSetsEditorProps> = ({ patchState, setPatchState }) => {
  const [editingSkillSet, setEditingSkillSet] = useState<{ type: SkillSetType, id: DokkanID } | null>(null);

  const handleAddSkillSet = (type: SkillSetType) => {
    const newId = generateLocalId(); // Generates ID in 7M range
    let newSet: any;
    switch (type) {
      case 'passiveSkillSets':
        newSet = { id: newId, name: `New Global Passive ${patchState.passiveSkillSets.length + 1}`, description: '', itemized_description: '', skills: [] } as PassiveSkillSet;
        break;
      case 'leaderSkillSets':
        newSet = { id: newId, name: `New Global Leader ${patchState.leaderSkillSets.length + 1}`, description: '', skills: [] } as LeaderSkillSet;
        break;
      case 'specialSets':
        newSet = { id: newId, name: `New Global Special ${patchState.specialSets.length + 1}`, description: '', skills: [], aim_target: 0, increase_rate: 180, lv_bonus: 25, is_inactive: 0 } as SpecialSet;
        break;
      case 'activeSkillSets':
        newSet = { id: newId, name: `New Global Active ${patchState.activeSkillSets.length + 1}`, effect_description: '', condition_description: '', turn: 1, exec_limit: 1, skills: [] } as ActiveSkillSet;
        break;
    }
    if (newSet) {
      setPatchState(prev => ({ ...prev, [type]: [...prev[type] as any[], newSet] }));
      setEditingSkillSet({ type, id: newId });
    }
  };

  const handleUpdateSkillSet = <T extends { id: DokkanID }> (type: SkillSetType, updatedSet: T) => {
    setPatchState(prev => ({
      ...prev,
      [type]: (prev[type] as any[]).map(s => s.id === updatedSet.id ? updatedSet : s)
    }));
  };

  const handleRemoveSkillSet = (type: SkillSetType, idToRemove: DokkanID) => {
    if (window.confirm(`Are you sure you want to delete skill set ${idToRemove}? This might break Card Form references.`)) {
        setPatchState(prev => ({
            ...prev,
            [type]: (prev[type] as Array<{id: DokkanID}>).filter(s => s.id !== idToRemove)
        }));
        if (editingSkillSet?.id === idToRemove) setEditingSkillSet(null);
    }
  };

  const renderSkillSetList = (type: SkillSetType, sets: Array<{ id: DokkanID, name: string }>) => (
    <div className="mb-8 p-4 bg-indigo-800 bg-opacity-40 rounded-lg shadow-lg border border-indigo-600">
      <h3 className="text-2xl font-bold mb-4 text-orange-400 font-rajdhani capitalize">{type.replace(/([A-Z])/g, ' $1').replace('Skill Sets', ' Skill Sets')}</h3>
      <button onClick={() => handleAddSkillSet(type)} className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md text-sm shadow-md hover:shadow-lg transition-all">
        <i className="fas fa-plus mr-2"></i> Add New {type.replace('SkillSets', ' Skill Set').replace('Sets', ' Set')}
      </button>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {sets.map(set => (
          <li key={set.id} 
              className={`p-3 rounded-md cursor-pointer flex justify-between items-center transition-all duration-150 ease-in-out shadow-sm hover:shadow-md font-rajdhani
                          ${editingSkillSet?.type === type && editingSkillSet?.id === set.id 
                            ? 'bg-orange-500 text-white ring-2 ring-orange-300' 
                            : 'bg-indigo-700 hover:bg-indigo-600 hover:text-orange-300'}`}
              onClick={() => setEditingSkillSet({ type, id: set.id })}>
            <span className="truncate"><span className="font-roboto-mono text-xs opacity-75">{set.id}</span> - {set.name}</span>
            <button onClick={(e) => { e.stopPropagation(); handleRemoveSkillSet(type, set.id);}} 
                    className="text-red-300 hover:text-red-500 hover:bg-red-700 hover:bg-opacity-50 rounded-full p-1 text-xs transition-colors">
                <i className="fas fa-trash"></i>
            </button>
          </li>
        ))}
         {sets.length === 0 && <p className="text-sm text-indigo-300 italic">No sets defined yet.</p>}
      </ul>
    </div>
  );

  const renderSkillSetEditor = () => {
    if (!editingSkillSet) return <p className="text-center text-indigo-300 font-rajdhani text-lg italic mt-10">Select a skill set to edit or create a new one.</p>;
    
    const { type, id } = editingSkillSet;
    const set = (patchState[type] as Array<any>).find(s => s.id === id);
    if (!set) {
        setEditingSkillSet(null);
        return <p className="text-red-400">Error: Skill set not found.</p>;
    }

    const commonFields = (
        <>
            <FormInput 
                label="ID" 
                value={set.id} 
                onChange={(val) => handleUpdateSkillSet(type, { ...set, id: val })} 
                disabled={!isLocallyGeneratedId(String(set.id))} 
                className="font-roboto-mono"
            />
            <FormInput label="Name" value={set.name} onChange={(val) => handleUpdateSkillSet(type, { ...set, name: val })} />
        </>
    );
    
    switch (type) {
      case 'passiveSkillSets':
        const ps = set as PassiveSkillSet;
        return (
          <div className="p-6 bg-indigo-800 bg-opacity-50 rounded-xl shadow-xl border-2 border-orange-500">
            <h4 className="text-2xl font-bold mb-4 text-orange-400 font-rajdhani">Editing Passive Skill Set: <span className="text-indigo-200">{ps.name}</span></h4>
            {commonFields}
            <FormTextArea label="Description (Player-facing)" value={ps.description} onChange={(val) => handleUpdateSkillSet(type, { ...ps, description: val })} rows={4}/>
            <FormTextArea label="Itemized Description" value={ps.itemized_description || ''} onChange={(val) => handleUpdateSkillSet(type, { ...ps, itemized_description: val })} rows={6}/>
            <SkillDetailEditor<PassiveSkill>
                skillSetId={ps.id}
                skills={ps.skills}
                updateSkills={(updatedSkills) => handleUpdateSkillSet(type, { ...ps, skills: updatedSkills })}
                initialSkillFactory={INITIAL_PASSIVE_SKILL}
                skillName="Passive Effect"
            />
          </div>
        );
      case 'leaderSkillSets':
        const ls = set as LeaderSkillSet;
        return (
          <div className="p-6 bg-indigo-800 bg-opacity-50 rounded-xl shadow-xl border-2 border-orange-500">
            <h4 className="text-2xl font-bold mb-4 text-orange-400 font-rajdhani">Editing Leader Skill Set: <span className="text-indigo-200">{ls.name}</span></h4>
            {commonFields}
            <FormTextArea label="Description (Player-facing)" value={ls.description} onChange={(val) => handleUpdateSkillSet(type, { ...ls, description: val })} rows={4}/>
            <SkillDetailEditor<LeaderSkill>
                skillSetId={ls.id}
                skills={ls.skills}
                updateSkills={(updatedSkills) => handleUpdateSkillSet(type, { ...ls, skills: updatedSkills })}
                initialSkillFactory={() => ({...INITIAL_LEADER_SKILL(), leader_skill_set_id: ls.id})}
                skillName="Leader Skill Effect"
            />
          </div>
        );
      case 'specialSets':
        const ss = set as SpecialSet;
        return (
          <div className="p-6 bg-indigo-800 bg-opacity-50 rounded-xl shadow-xl border-2 border-orange-500">
            <h4 className="text-2xl font-bold mb-4 text-orange-400 font-rajdhani">Editing Special Set: <span className="text-indigo-200">{ss.name}</span></h4>
            {commonFields}
            <FormTextArea label="Description" value={ss.description} onChange={(val) => handleUpdateSkillSet(type, { ...ss, description: val })} rows={3}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <FormInput label="Aim Target" type="number" value={ss.aim_target} onChange={(val) => handleUpdateSkillSet(type, { ...ss, aim_target: Number(val) })} />
              <FormInput label="Increase Rate" type="number" value={ss.increase_rate} onChange={(val) => handleUpdateSkillSet(type, { ...ss, increase_rate: Number(val) })} />
              <FormInput label="Level Bonus" type="number" value={ss.lv_bonus} onChange={(val) => handleUpdateSkillSet(type, { ...ss, lv_bonus: Number(val) })} />
              <FormSelect label="Is Inactive" value={ss.is_inactive} onChange={(val) => handleUpdateSkillSet(type, { ...ss, is_inactive: Number(val) })} options={[{label:'Active', value:0}, {label:'Inactive', value:1}]} />
            </div>
            <SkillDetailEditor<Special>
                skillSetId={ss.id}
                skills={ss.skills}
                updateSkills={(updatedSkills) => handleUpdateSkillSet(type, { ...ss, skills: updatedSkills })}
                initialSkillFactory={() => ({...INITIAL_SPECIAL_SKILL(), special_set_id: ss.id})}
                skillName="Special Effect"
            />
          </div>
        );
      case 'activeSkillSets':
        const as = set as ActiveSkillSet;
        return (
          <div className="p-6 bg-indigo-800 bg-opacity-50 rounded-xl shadow-xl border-2 border-orange-500">
            <h4 className="text-2xl font-bold mb-4 text-orange-400 font-rajdhani">Editing Active Skill Set: <span className="text-indigo-200">{as.name}</span></h4>
            {commonFields}
            <FormTextArea label="Effect Description" value={as.effect_description} onChange={(val) => handleUpdateSkillSet(type, { ...as, effect_description: val })} rows={3}/>
            <FormTextArea label="Condition Description" value={as.condition_description} onChange={(val) => handleUpdateSkillSet(type, { ...as, condition_description: val })} rows={3}/>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <FormInput label="Turn" type="number" value={as.turn} onChange={(val) => handleUpdateSkillSet(type, { ...as, turn: Number(val) })} />
                <FormInput label="Execution Limit" type="number" value={as.exec_limit} onChange={(val) => handleUpdateSkillSet(type, { ...as, exec_limit: Number(val) })} />
                <FormInput label="BGM ID" type="number" value={as.bgm_id || ''} onChange={(val) => handleUpdateSkillSet(type, { ...as, bgm_id: val ? Number(val) : null })} placeholder="Optional BGM ID" />
                <FormInput label="Ultimate Special ID" type="number" value={as.ultimate_special_id || ''} onChange={(val) => handleUpdateSkillSet(type, { ...as, ultimate_special_id: val ? Number(val) : null })} placeholder="Optional" />
                <FormInput label="Special View ID" type="number" value={as.special_view_id || ''} onChange={(val) => handleUpdateSkillSet(type, { ...as, special_view_id: val ? Number(val) : null })} placeholder="Optional" />
             </div>
            <SkillDetailEditor<ActiveSkillEffect>
                skillSetId={as.id}
                skills={as.skills}
                updateSkills={(updatedSkills) => handleUpdateSkillSet(type, { ...as, skills: updatedSkills })}
                initialSkillFactory={() => ({...INITIAL_ACTIVE_SKILL_EFFECT(), active_skill_set_id: as.id})}
                skillName="Active Skill Effect"
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div className="space-y-6">
        {renderSkillSetList('passiveSkillSets', patchState.passiveSkillSets)}
        {renderSkillSetList('leaderSkillSets', patchState.leaderSkillSets)}
      </div>
      <div className="space-y-6">
        {renderSkillSetList('specialSets', patchState.specialSets)}
        {renderSkillSetList('activeSkillSets', patchState.activeSkillSets)}
      </div>
      <div className="md:col-span-2 mt-4">
        {renderSkillSetEditor()}
      </div>
    </div>
  );
};
