import React, { useState } from 'react';
import {
  DokkanPatchState,
  PassiveSkillEffectEntry,
  EffectPackEntry,
  DokkanID,
  SubTargetTypeSet,
  SubTargetType,
  UltimateSpecial,
  SpecialView,
  Character,
  CardUniqueInfo,
} from '../types';
import { FormInput } from './FormControls';
import { useToast } from '../context/ToastContext';
import {
  generateLocalId,
  INITIAL_ULTIMATE_SPECIAL,
  INITIAL_SPECIAL_VIEW,
  INITIAL_CHARACTER,
} from '../constants';
import { getSpecialView } from '../services/databaseService';
import { Database } from 'sql.js';

interface MiscTablesEditorProps {
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  dbInstance?: Database | null;
}

type PatchListKeyWithIdItems =
  | 'passiveSkillEffects'
  | 'effectPacks'
  | 'subTargetTypeSets'
  | 'subTargetTypes'
  | 'ultimateSpecials'
  | 'specialViews'
  | 'characters'
  | 'cardUniqueInfos';

type SectionKey =
  | 'passiveSkillEffects'
  | 'effectPacks'
  | 'subTargetTypeSets'
  | 'subTargetTypes'
  | 'ultimateSpecials'
  | 'specialViews'
  | 'characters'
  | 'cardUniqueInfos';

export const MiscTablesEditor: React.FC<MiscTablesEditorProps> = ({
  patchState,
  setPatchState,
  dbInstance,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('characters');
  const { addToast } = useToast();

  const handleAddEntry = <K extends PatchListKeyWithIdItems, V extends DokkanPatchState[K][number]>(
    listKey: K,
    factory: () => V
  ) => {
    const newItem = factory();
    setPatchState((prev) => {
      const currentList = prev[listKey] as V[] | undefined;
      const newList = [...(currentList || []), newItem];
      return { ...prev, [listKey]: newList };
    });
  };

  const handleUpdateEntry = <
    K extends PatchListKeyWithIdItems,
    V extends DokkanPatchState[K][number],
  >(
    listKey: K,
    index: number,
    field: keyof V,
    value: V[keyof V]
  ) => {
    setPatchState((prev) => {
      const list = prev[listKey] as V[];
      if (field === 'id') {
        const newId = value as DokkanID;
        const originalId = list[index]?.id;
        if (newId !== originalId && list.some((item) => item.id === newId)) {
          addToast(`Error: ID "${newId}" is already in use in ${listKey}.`, { type: 'error' });
          return prev;
        }
      }
      const updatedList = list.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...prev, [listKey]: updatedList };
    });
  };

  const handleRemoveEntry = <K extends PatchListKeyWithIdItems>(listKey: K, index: number) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    setPatchState((prev) => {
      const list = prev[listKey] as DokkanPatchState[K][number][];
      const updatedList = list.filter((_, i) => i !== index);
      return { ...prev, [listKey]: updatedList };
    });
  };

  const createInitialPassiveSkillEffect = (): PassiveSkillEffectEntry => ({
    id: generateLocalId(),
    script_name: '',
    lite_flicker_rate: 0,
    bgm_id: null,
  });

  const createInitialEffectPack = (): EffectPackEntry => ({
    id: generateLocalId(),
    category: 1,
    name: '',
    pack_name: '',
    scene_name: '',
    red: 255,
    green: 255,
    blue: 255,
    alpha: 255,
    lite_flicker_rate: 0,
  });

  const createInitialSubTargetTypeSet = (): SubTargetTypeSet => ({
    id: generateLocalId(),
  });

  const createInitialSubTargetType = (): SubTargetType => ({
    id: generateLocalId(),
    sub_target_type_set_id: '',
    target_value_type: 0,
    target_value: 0,
  });

  const createInitialUltimateSpecial = (): UltimateSpecial => INITIAL_ULTIMATE_SPECIAL();
  const createInitialSpecialView = (): SpecialView => INITIAL_SPECIAL_VIEW();
  const createInitialCharacter = (): Character => INITIAL_CHARACTER();
  const createInitialCardUniqueInfo = (): CardUniqueInfo => ({
    id: generateLocalId(),
    name: '',
    kana: '',
  });

  const handleImportSpecialView = async () => {
    if (!dbInstance) {
      addToast('Database not loaded.', { type: 'warning' });
      return;
    }
    const idStr = prompt('Enter Special View ID to import:');
    if (!idStr) return;

    const id = idStr.trim();
    if (!id) return;

    if (patchState.specialViews?.some((sv) => sv.id === id)) {
      addToast('This Special View ID is already in the patch.', { type: 'warning' });
      return;
    }

    const sv = await getSpecialView(dbInstance, id);
    if (sv) {
      setPatchState((prev) => ({
        ...prev,
        specialViews: [...(prev.specialViews || []), sv],
      }));
      addToast(`Imported Special View ${id}`, { type: 'success' });
    } else {
      addToast(`Special View ${id} not found in database.`, { type: 'error' });
    }
  };

  const sections: { id: SectionKey; label: string; icon: string }[] = [
    { id: 'characters', label: 'Characters', icon: 'fa-user' },
    { id: 'cardUniqueInfos', label: 'Card Unique Info', icon: 'fa-id-card' },
    { id: 'passiveSkillEffects', label: 'Passive Skill Effects', icon: 'fa-magic' },
    { id: 'effectPacks', label: 'Effect Packs', icon: 'fa-box-open' },
    { id: 'subTargetTypeSets', label: 'Sub Target Type Sets', icon: 'fa-layer-group' },
    { id: 'subTargetTypes', label: 'Sub Target Types', icon: 'fa-bullseye' },
    { id: 'ultimateSpecials', label: 'Ultimate Specials', icon: 'fa-star' },
    { id: 'specialViews', label: 'Special Views', icon: 'fa-video' },
  ];

  const renderSidebar = () => (
    <div className="w-full md:w-64 flex-shrink-0 bg-[var(--clr-bg-card)] rounded-lg border border-[var(--clr-border)] overflow-hidden h-fit sticky top-4">
      <div className="p-4 bg-[var(--clr-bg-surface)] border-b border-[var(--clr-border)]">
        <h3 className="font-bold text-[var(--clr-accent)] font-rajdhani text-lg">Misc Tables</h3>
      </div>
      <div className="flex flex-col">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-3 text-left flex items-center space-x-3 transition-colors ${activeSection === section.id
              ? 'bg-[var(--clr-accent)]/10 text-[var(--clr-accent)] border-l-4 border-[var(--clr-accent)]'
              : 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-bg-surface)] hover:text-[var(--clr-text-main)] border-l-4 border-transparent'
              }`}
          >
            <i className={`fas ${section.icon} w-5 text-center`}></i>
            <span className="font-medium text-sm">{section.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'characters':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Characters (characters)
              </h3>
              <button
                onClick={() => handleAddEntry('characters', createInitialCharacter)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Character
              </button>
            </div>
            {patchState.characters?.map((char, index) => (
              <div
                key={char.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('characters', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={char.id}
                  onChange={(val) => handleUpdateEntry('characters', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Name"
                  value={char.name}
                  onChange={(val) => handleUpdateEntry('characters', index, 'name', val)}
                />
                <FormInput
                  label="Race"
                  value={char.race}
                  onChange={(val) => handleUpdateEntry('characters', index, 'race', val)}
                />
                <FormInput
                  label="Sex"
                  value={char.sex}
                  onChange={(val) => handleUpdateEntry('characters', index, 'sex', val)}
                />
                <FormInput
                  label="Size"
                  value={char.size}
                  onChange={(val) => handleUpdateEntry('characters', index, 'size', val)}
                />
              </div>
            ))}
            {(!patchState.characters || patchState.characters.length === 0) && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">No characters added.</p>
            )}
          </section>
        );

      case 'cardUniqueInfos':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Card Unique Info (card_unique_infos)
              </h3>
              <button
                onClick={() => handleAddEntry('cardUniqueInfos', createInitialCardUniqueInfo)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Unique Info
              </button>
            </div>
            {patchState.cardUniqueInfos?.map((info, index) => (
              <div
                key={info.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('cardUniqueInfos', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={info.id}
                  onChange={(val) => handleUpdateEntry('cardUniqueInfos', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Name"
                  value={info.name}
                  onChange={(val) => handleUpdateEntry('cardUniqueInfos', index, 'name', val)}
                />
                <FormInput
                  label="Kana (Optional)"
                  value={info.kana || ''}
                  onChange={(val) => handleUpdateEntry('cardUniqueInfos', index, 'kana', val)}
                />
              </div>
            ))}
            {(!patchState.cardUniqueInfos || patchState.cardUniqueInfos.length === 0) && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">No unique info added.</p>
            )}
          </section>
        );

      case 'passiveSkillEffects':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Passive Skill Effects (passive_skill_effects)
              </h3>
              <button
                onClick={() => handleAddEntry('passiveSkillEffects', createInitialPassiveSkillEffect)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Effect
              </button>
            </div>
            {patchState.passiveSkillEffects.map((effect, index) => (
              <div
                key={effect.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('passiveSkillEffects', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={effect.id}
                  onChange={(val) => handleUpdateEntry('passiveSkillEffects', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Script Name"
                  value={effect.script_name}
                  onChange={(val) =>
                    handleUpdateEntry('passiveSkillEffects', index, 'script_name', val)
                  }
                />
                <FormInput
                  label="Lite Flicker Rate"
                  type="number"
                  value={effect.lite_flicker_rate}
                  onChange={(val) =>
                    handleUpdateEntry('passiveSkillEffects', index, 'lite_flicker_rate', Number(val))
                  }
                />
                <FormInput
                  label="BGM ID (Optional)"
                  type="number"
                  value={effect.bgm_id ?? ''}
                  onChange={(val) =>
                    handleUpdateEntry('passiveSkillEffects', index, 'bgm_id', val ? Number(val) : null)
                  }
                  className="font-roboto-mono"
                />
              </div>
            ))}
            {patchState.passiveSkillEffects.length === 0 && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">
                No passive skill effects added.
              </p>
            )}
          </section>
        );

      case 'effectPacks':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Effect Packs (effect_packs)
              </h3>
              <button
                onClick={() => handleAddEntry('effectPacks', createInitialEffectPack)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Pack
              </button>
            </div>
            {patchState.effectPacks.map((pack, index) => (
              <div
                key={pack.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('effectPacks', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={pack.id}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Category"
                  type="number"
                  value={pack.category}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'category', Number(val))}
                />
                <FormInput
                  label="Name"
                  value={pack.name}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'name', val)}
                />
                <FormInput
                  label="Pack Name"
                  value={pack.pack_name}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'pack_name', val)}
                />
                <FormInput
                  label="Scene Name"
                  value={pack.scene_name}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'scene_name', val)}
                />
                <FormInput
                  label="Red"
                  type="number"
                  value={pack.red}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'red', Number(val))}
                />
                <FormInput
                  label="Green"
                  type="number"
                  value={pack.green}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'green', Number(val))}
                />
                <FormInput
                  label="Blue"
                  type="number"
                  value={pack.blue}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'blue', Number(val))}
                />
                <FormInput
                  label="Alpha"
                  type="number"
                  value={pack.alpha}
                  onChange={(val) => handleUpdateEntry('effectPacks', index, 'alpha', Number(val))}
                />
                <FormInput
                  label="Lite Flicker Rate"
                  type="number"
                  value={pack.lite_flicker_rate}
                  onChange={(val) =>
                    handleUpdateEntry('effectPacks', index, 'lite_flicker_rate', Number(val))
                  }
                />

              </div>
            ))}
            {patchState.effectPacks.length === 0 && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">No effect packs added.</p>
            )}
          </section>
        );

      case 'subTargetTypeSets':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Sub Target Type Sets (sub_target_type_sets)
              </h3>
              <button
                onClick={() => handleAddEntry('subTargetTypeSets', createInitialSubTargetTypeSet)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Set
              </button>
            </div>
            {patchState.subTargetTypeSets?.map((set, index) => (
              <div
                key={set.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('subTargetTypeSets', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={set.id}
                  onChange={(val) => handleUpdateEntry('subTargetTypeSets', index, 'id', val)}
                  className="font-roboto-mono"
                />
              </div>
            ))}
            {(!patchState.subTargetTypeSets || patchState.subTargetTypeSets.length === 0) && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">
                No sub target type sets added.
              </p>
            )}
          </section>
        );

      case 'subTargetTypes':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Sub Target Types (sub_target_types)
              </h3>
              <button
                onClick={() => handleAddEntry('subTargetTypes', createInitialSubTargetType)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Type
              </button>
            </div>
            {patchState.subTargetTypes?.map((type, index) => (
              <div
                key={type.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('subTargetTypes', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={type.id}
                  onChange={(val) => handleUpdateEntry('subTargetTypes', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Set ID"
                  value={type.sub_target_type_set_id}
                  onChange={(val) =>
                    handleUpdateEntry('subTargetTypes', index, 'sub_target_type_set_id', val)
                  }
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Target Value Type"
                  type="number"
                  value={type.target_value_type}
                  onChange={(val) =>
                    handleUpdateEntry('subTargetTypes', index, 'target_value_type', Number(val))
                  }
                />
                <FormInput
                  label="Target Value"
                  type="number"
                  value={type.target_value}
                  onChange={(val) =>
                    handleUpdateEntry('subTargetTypes', index, 'target_value', Number(val))
                  }
                />
              </div>
            ))}
            {(!patchState.subTargetTypes || patchState.subTargetTypes.length === 0) && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">No sub target types added.</p>
            )}
          </section>
        );

      case 'ultimateSpecials':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Ultimate Specials (ultimate_specials)
              </h3>
              <button
                onClick={() => handleAddEntry('ultimateSpecials', createInitialUltimateSpecial)}
                className="btn-secondary py-1.5 px-3 rounded-md text-sm"
              >
                <i className="fas fa-plus mr-1"></i> Add Ultimate Special
              </button>
            </div>
            {patchState.ultimateSpecials?.map((us, index) => (
              <div
                key={us.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('ultimateSpecials', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={us.id}
                  onChange={(val) => handleUpdateEntry('ultimateSpecials', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Name"
                  value={us.name}
                  onChange={(val) => handleUpdateEntry('ultimateSpecials', index, 'name', val)}
                />
                <FormInput
                  label="Description"
                  value={us.description}
                  onChange={(val) => handleUpdateEntry('ultimateSpecials', index, 'description', val)}
                />
                <FormInput
                  label="Increase Rate"
                  type="number"
                  value={us.increase_rate}
                  onChange={(val) =>
                    handleUpdateEntry('ultimateSpecials', index, 'increase_rate', Number(val))
                  }
                />
                <FormInput
                  label="Aim Target"
                  type="number"
                  value={us.aim_target}
                  onChange={(val) =>
                    handleUpdateEntry('ultimateSpecials', index, 'aim_target', Number(val))
                  }
                />
              </div>
            ))}
            {(!patchState.ultimateSpecials || patchState.ultimateSpecials.length === 0) && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">
                No ultimate specials added.
              </p>
            )}
          </section>
        );

      case 'specialViews':
        return (
          <section className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-[var(--clr-accent)] font-rajdhani">
                Special Views (special_views)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleImportSpecialView}
                  className="btn-secondary py-1.5 px-3 rounded-md text-sm"
                  title="Import from DB via ID"
                >
                  <i className="fas fa-file-import mr-1"></i> Import ID
                </button>
                <button
                  onClick={() => handleAddEntry('specialViews', createInitialSpecialView)}
                  className="btn-secondary py-1.5 px-3 rounded-md text-sm"
                >
                  <i className="fas fa-plus mr-1"></i> Add View
                </button>
              </div>
            </div>
            {patchState.specialViews?.map((sv, index) => (
              <div
                key={sv.id || index}
                className="mb-4 p-4 bg-[var(--clr-bg-card)] rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 relative border border-[var(--clr-border)] shadow-sm"
              >
                <button
                  onClick={() => handleRemoveEntry('specialViews', index)}
                  className="absolute top-2 right-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] text-xs p-1 bg-[var(--clr-danger)]/20 hover:bg-[var(--clr-danger)]/40 rounded-full transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
                <FormInput
                  label="ID"
                  value={sv.id}
                  onChange={(val) => handleUpdateEntry('specialViews', index, 'id', val)}
                  className="font-roboto-mono"
                />
                <FormInput
                  label="Script Name"
                  value={sv.script_name}
                  onChange={(val) => handleUpdateEntry('specialViews', index, 'script_name', val)}
                />
                <FormInput
                  label="Cut-in Card ID"
                  type="number"
                  value={sv.cut_in_card_id}
                  onChange={(val) =>
                    handleUpdateEntry('specialViews', index, 'cut_in_card_id', Number(val))
                  }
                />
                <FormInput
                  label="Special Name No"
                  type="number"
                  value={sv.special_name_no}
                  onChange={(val) =>
                    handleUpdateEntry('specialViews', index, 'special_name_no', Number(val))
                  }
                />
                <FormInput
                  label="Special Motion"
                  type="number"
                  value={sv.special_motion}
                  onChange={(val) =>
                    handleUpdateEntry('specialViews', index, 'special_motion', Number(val))
                  }
                />
                <FormInput
                  label="Lite Flicker Rate"
                  type="number"
                  value={sv.lite_flicker_rate}
                  onChange={(val) =>
                    handleUpdateEntry('specialViews', index, 'lite_flicker_rate', Number(val))
                  }
                />
                <FormInput
                  label="Energy Color (Optional)"
                  type="number"
                  value={sv.energy_color ?? ''}
                  onChange={(val) =>
                    handleUpdateEntry('specialViews', index, 'energy_color', val ? Number(val) : null)
                  }
                />
                <FormInput
                  label="Special Category ID"
                  type="number"
                  value={sv.special_category_id}
                  onChange={(val) =>
                    handleUpdateEntry('specialViews', index, 'special_category_id', Number(val))
                  }
                />
              </div>
            ))}
            {(!patchState.specialViews || patchState.specialViews.length === 0) && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">No special views added.</p>
            )}
          </section>
        );

      default:
        return <div>Select a table from the sidebar</div>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[var(--clr-accent)] font-rajdhani border-b-2 border-[var(--clr-accent)] pb-2">
        Miscellaneous Table Entries
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {renderSidebar()}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
