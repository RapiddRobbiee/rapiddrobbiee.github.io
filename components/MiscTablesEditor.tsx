
import React from 'react';
import { DokkanPatchState, PassiveSkillEffectEntry, EffectPackEntry, DokkanID } from '../types';
import { FormInput } from './FormControls';
import { generateLocalId } from '../constants';

interface MiscTablesEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
}

// Fix: Define a type for keys that map to lists of items with an ID
type PatchListKeyWithIdItems = 'passiveSkillEffects' | 'effectPacks';

export const MiscTablesEditor: React.FC<MiscTablesEditorProps> = ({ patchState, setPatchState }) => {

  // Fix: Refactor generic function for type safety
  const handleAddEntry = <K extends PatchListKeyWithIdItems, V extends DokkanPatchState[K][number]>(
    listKey: K, 
    factory: () => V
  ) => {
    setPatchState(prev => {
      const currentList = prev[listKey] as V[] | undefined; // prev[listKey] could be undefined if not initialized
      const newList = [...(currentList || []), factory()];
      return { ...prev, [listKey]: newList };
    });
  };

  // Fix: Refactor generic function for type safety
  const handleUpdateEntry = <K extends PatchListKeyWithIdItems, V extends DokkanPatchState[K][number]>(
    listKey: K, 
    index: number, 
    field: keyof V, 
    value: V[keyof V] // More precise type for value
  ) => {
    setPatchState(prev => {
      const list = prev[listKey] as V[];
      const updatedList = list.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, [listKey]: updatedList };
    });
  };

  // Fix: Refactor generic function for type safety
  const handleRemoveEntry = <K extends PatchListKeyWithIdItems>(
    listKey: K, 
    index: number
  ) => {
    setPatchState(prev => {
      const list = prev[listKey] as DokkanPatchState[K][number][];
      const updatedList = list.filter((_, i) => i !== index);
      return { ...prev, [listKey]: updatedList };
    });
  };

  const createInitialPassiveSkillEffect = (): PassiveSkillEffectEntry => ({
    id: generateLocalId('pse'),
    script_name: '',
    lite_flicker_rate: 0,
    bgm_id: null,
  });

  const createInitialEffectPack = (): EffectPackEntry => ({
    id: generateLocalId('efp'),
    category: 1,
    name: '',
    pack_name: '',
    scene_name: '',
    red: 255, green: 255, blue: 255, alpha: 255,
    lite_flicker_rate: 0,
  });


  return (
    <div className="space-y-10">
      <h2 className="text-3xl font-bold text-orange-400 font-rajdhani border-b-2 border-orange-500 pb-2 mb-8">Miscellaneous Table Entries</h2>
      {/* Passive Skill Effects Editor */}
      <section className="p-6 bg-indigo-800 bg-opacity-30 rounded-xl shadow-xl border border-indigo-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-orange-300 font-rajdhani">Passive Skill Effects (passive_skill_effects)</h3>
            <button 
                onClick={() => handleAddEntry('passiveSkillEffects', createInitialPassiveSkillEffect)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-md hover:shadow-lg transition-all"
            >
                <i className="fas fa-plus mr-1"></i> Add Effect
            </button>
        </div>
        {patchState.passiveSkillEffects.map((effect, index) => (
          <div key={effect.id || index} className="mb-4 p-4 bg-indigo-700 bg-opacity-40 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 relative border border-indigo-600 shadow-sm">
            <button onClick={() => handleRemoveEntry('passiveSkillEffects', index)} className="absolute top-2 right-2 text-red-300 hover:text-red-400 text-xs p-1 bg-red-700 bg-opacity-30 hover:bg-opacity-50 rounded-full transition-colors"><i className="fas fa-times"></i></button>
            <FormInput label="ID" value={effect.id} onChange={(val) => handleUpdateEntry('passiveSkillEffects', index, 'id', val)} disabled={!effect.id.startsWith('local_')} className="font-roboto-mono"/>
            <FormInput label="Script Name" value={effect.script_name} onChange={(val) => handleUpdateEntry('passiveSkillEffects', index, 'script_name', val)} />
            <FormInput label="Lite Flicker Rate" type="number" value={effect.lite_flicker_rate} onChange={(val) => handleUpdateEntry('passiveSkillEffects', index, 'lite_flicker_rate', Number(val))} />
            <FormInput label="BGM ID (Optional)" type="number" value={effect.bgm_id ?? ''} onChange={(val) => handleUpdateEntry('passiveSkillEffects', index, 'bgm_id', val ? Number(val) : null)} className="font-roboto-mono"/>
          </div>
        ))}
        {patchState.passiveSkillEffects.length === 0 && <p className="text-sm text-indigo-300 italic">No passive skill effects added.</p>}
      </section>

      {/* Effect Packs Editor */}
      <section className="p-6 bg-indigo-800 bg-opacity-30 rounded-xl shadow-xl border border-indigo-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-orange-300 font-rajdhani">Effect Packs (effect_packs)</h3>
            <button 
                onClick={() => handleAddEntry('effectPacks', createInitialEffectPack)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-md hover:shadow-lg transition-all"
            >
                <i className="fas fa-plus mr-1"></i> Add Pack
            </button>
        </div>
        {patchState.effectPacks.map((pack, index) => (
          <div key={pack.id || index} className="mb-4 p-4 bg-indigo-700 bg-opacity-40 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-3 relative border border-indigo-600 shadow-sm">
            <button onClick={() => handleRemoveEntry('effectPacks', index)} className="absolute top-2 right-2 text-red-300 hover:text-red-400 text-xs p-1 bg-red-700 bg-opacity-30 hover:bg-opacity-50 rounded-full transition-colors"><i className="fas fa-times"></i></button>
            <FormInput label="ID" value={pack.id} onChange={(val) => handleUpdateEntry('effectPacks', index, 'id', val)} disabled={!pack.id.startsWith('local_')} className="font-roboto-mono"/>
            <FormInput label="Category" type="number" value={pack.category} onChange={(val) => handleUpdateEntry('effectPacks', index, 'category', Number(val))} />
            <FormInput label="Name" value={pack.name} onChange={(val) => handleUpdateEntry('effectPacks', index, 'name', val)} />
            <FormInput label="Pack Name" value={pack.pack_name} onChange={(val) => handleUpdateEntry('effectPacks', index, 'pack_name', val)} />
            <FormInput label="Scene Name" value={pack.scene_name} onChange={(val) => handleUpdateEntry('effectPacks', index, 'scene_name', val)} />
            <FormInput label="Red" type="number" value={pack.red} onChange={(val) => handleUpdateEntry('effectPacks', index, 'red', Number(val))} />
            <FormInput label="Green" type="number" value={pack.green} onChange={(val) => handleUpdateEntry('effectPacks', index, 'green', Number(val))} />
            <FormInput label="Blue" type="number" value={pack.blue} onChange={(val) => handleUpdateEntry('effectPacks', index, 'blue', Number(val))} />
            <FormInput label="Alpha" type="number" value={pack.alpha} onChange={(val) => handleUpdateEntry('effectPacks', index, 'alpha', Number(val))} />
            <FormInput label="Lite Flicker Rate" type="number" value={pack.lite_flicker_rate} onChange={(val) => handleUpdateEntry('effectPacks', index, 'lite_flicker_rate', Number(val))} />
          </div>
        ))}
        {patchState.effectPacks.length === 0 && <p className="text-sm text-indigo-300 italic">No effect packs added.</p>}
      </section>
    </div>
  );
};