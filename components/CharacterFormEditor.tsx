import React, { useCallback, useState, useEffect } from 'react';
import { CardForm, DokkanPatchState, DokkanID, CardSpecial } from '../types';
import {
  ELEMENT_TYPE_OPTIONS,
  RARITY_TYPE_OPTIONS,
  INITIAL_CARD_SPECIAL,
  isLocallyGeneratedId,
  ID_PREFIXES,
  CATEGORIES,
  CATEGORY_SELECT_OPTIONS,
  CUSTOM_CATEGORY_ID_VALUE,
  LINK_SKILLS,
  LINK_SKILL_SELECT_OPTIONS,
  CUSTOM_LINK_ID_VALUE,
  UR_RARITY_DEFAULTS,
  LR_RARITY_DEFAULTS,
} from '../constants';
import { FormInput, FormSelect, FormTextArea } from './FormControls';
import { SearchableSelect } from './SearchableSelect';
import { CausalityEditor } from './CausalityEditor';
import { logAnalyticsEvent } from '../services/analyticsService';
import { useToast } from '../context/ToastContext';

interface CharacterFormEditorProps {
  formIndex: number;
  cardForm: CardForm;
  updateCardForm: (index: number, updatedForm: CardForm) => void;
  removeCardForm: (index: number) => void;
  duplicateCardForm: (index: number) => void;
  patchState: DokkanPatchState;
  setPatchState: React.Dispatch<React.SetStateAction<DokkanPatchState>>;
  defaultAdvancedOpen: boolean;
  dbInstance: any;
  settings: any;
  skillCausalities: any[];
  onCreateSkillCausality: (
    causality_type: number,
    cau_val1: number | string,
    cau_val2: number | string,
    cau_val3: number | string
  ) => Promise<DokkanID>;
  onFetchSkillCausality: (id: DokkanID) => Promise<void>;
  wizardStep?: number;
}

const EditorContent: React.FC<
  CharacterFormEditorProps
> = ({
  formIndex,
  cardForm,
  updateCardForm,
  patchState,
  setPatchState,
  defaultAdvancedOpen,
  dbInstance,
  settings,
  skillCausalities,
  onCreateSkillCausality,
  onFetchSkillCausality,
  wizardStep,
}) => {
    const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState<string>('');
    const [customCategoryId, setCustomCategoryId] = useState<string>('');
    const [localCardId, setLocalCardId] = useState<string>(cardForm.id);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(defaultAdvancedOpen);
    const [expandedBonuses, setExpandedBonuses] = useState<Record<DokkanID, boolean>>({});
    const { addToast } = useToast();

    useEffect(() => {
      setLocalCardId(cardForm.id);
    }, [cardForm.id]);

    const handleChange = useCallback(
      (field: keyof CardForm, value: any) => {
        if (field === 'rarity') {
          const newRarity = Number(value);
          let updatedForm = { ...cardForm, rarity: newRarity };
          if (newRarity === 4) {
            // UR
            updatedForm = { ...updatedForm, ...UR_RARITY_DEFAULTS };
          } else if (newRarity === 5) {
            // LR
            updatedForm = { ...updatedForm, ...LR_RARITY_DEFAULTS };
          }
          updateCardForm(formIndex, updatedForm);
        } else {
          updateCardForm(formIndex, { ...cardForm, [field]: value });
        }
      },
      [cardForm, formIndex, updateCardForm]
    );

    const handleIdBlur = () => {
      if (localCardId === cardForm.id) return;

      if (patchState.cardForms.some((form) => form.id === localCardId)) {
        addToast(`Error: Card ID "${localCardId}" is already in use.`, { type: 'error' });
        setLocalCardId(cardForm.id); // Revert local state
        return;
      }
      handleChange('id', localCardId);
    };

    const handleListChange = useCallback(
      (field: keyof CardForm, itemIndex: number, value: string) => {
        const currentList = (cardForm[field] as string[]) || [];
        const newList = [...currentList];
        newList[itemIndex] = value;
        handleChange(field, newList);
      },
      [cardForm, handleChange]
    );

    const handleAddCategory = useCallback(() => {
      let idToAdd = '';
      if (selectedCategoryToAdd === CUSTOM_CATEGORY_ID_VALUE) {
        idToAdd = customCategoryId.trim();
      } else {
        idToAdd = selectedCategoryToAdd;
      }

      if (idToAdd && !(cardForm.category_ids || []).includes(idToAdd)) {
        const newCategories = [...(cardForm.category_ids || []), idToAdd];
        handleChange('category_ids', newCategories);
        logAnalyticsEvent('add_category_to_card', { card_id: cardForm.id, category_id: idToAdd });
      }
      setSelectedCategoryToAdd('');
      setCustomCategoryId('');
    }, [cardForm.id, cardForm.category_ids, customCategoryId, selectedCategoryToAdd, handleChange]);

    const handleRemoveCategory = useCallback(
      (idToRemove: string) => {
        const newCategories = (cardForm.category_ids || []).filter((id) => id !== idToRemove);
        handleChange('category_ids', newCategories);
        logAnalyticsEvent('remove_category_from_card', {
          card_id: cardForm.id,
          category_id: idToRemove,
        });
      },
      [cardForm.id, cardForm.category_ids, handleChange]
    );

    const handleLinkSkillSelectionChange = useCallback(
      (linkIndex: number, newSelectValue: string) => {
        const currentStoredId = cardForm.link_skill_ids[linkIndex] || '';
        const currentIsPredefined = LINK_SKILL_SELECT_OPTIONS.some(
          (opt) => opt.value === currentStoredId && currentStoredId !== ''
        );

        if (newSelectValue === CUSTOM_LINK_ID_VALUE) {
          if (currentIsPredefined) {
            handleListChange('link_skill_ids', linkIndex, '');
          }
        } else {
          handleListChange('link_skill_ids', linkIndex, newSelectValue);
          logAnalyticsEvent('update_link_skill', {
            card_id: cardForm.id,
            link_index: linkIndex,
            new_link_id: newSelectValue,
          });
        }
      },
      [cardForm.id, cardForm.link_skill_ids, handleListChange]
    );

    const cardSpecialsForThisForm = patchState.cardSpecials.filter(
      (cs) => cs.card_id === cardForm.id
    );

    const handleAddCardSpecial = () => {
      const defaultSpecialSetId = isLocallyGeneratedId(cardForm.id)
        ? ID_PREFIXES.SPECIAL_SET + cardForm.id
        : undefined;
      const newCardSpecial = INITIAL_CARD_SPECIAL(cardForm.id, defaultSpecialSetId);
      setPatchState((prev) => ({
        ...prev,
        cardSpecials: [...prev.cardSpecials, newCardSpecial],
      }));
      logAnalyticsEvent('add_card_special', { card_id: cardForm.id, new_cs_id: newCardSpecial.id });
    };

    const handleUpdateCardSpecial = (
      specialIndexInFilteredList: number,
      field: keyof CardSpecial,
      value: any
    ) => {
      const actualIndexInGlobalList = patchState.cardSpecials.findIndex(
        (cs) => cs.id === cardSpecialsForThisForm[specialIndexInFilteredList].id
      );
      if (actualIndexInGlobalList === -1) return;

      setPatchState((prev) => {
        if (field === 'id') {
          const newId = String(value);
          const originalId = cardSpecialsForThisForm[specialIndexInFilteredList].id;
          if (newId !== originalId && prev.cardSpecials.some((cs) => cs.id === newId)) {
            addToast(`Error: Card Special ID "${newId}" is already in use.`, { type: 'error' });
            return prev; // Don't apply change
          }
        }
        return {
          ...prev,
          cardSpecials: prev.cardSpecials.map((cs, i) =>
            i === actualIndexInGlobalList ? { ...cs, [field]: value } : cs
          ),
        };
      });
    };

    const handleRemoveCardSpecial = (specialIndexInFilteredList: number) => {
      const idToRemove = cardSpecialsForThisForm[specialIndexInFilteredList].id;
      setPatchState((prev) => ({
        ...prev,
        cardSpecials: prev.cardSpecials.filter((cs) => cs.id !== idToRemove),
      }));
      logAnalyticsEvent('remove_card_special', { card_id: cardForm.id, removed_cs_id: idToRemove });
    };

    const getCategoryDisplayName = (id: DokkanID): string => {
      const foundCategory = CATEGORIES.find((cat) => cat.id === id);
      return foundCategory ? `${foundCategory.name} (ID: ${id})` : `Custom ID: ${id}`;
    };

    const getLinkSkillDisplayName = (id: DokkanID): string => {
      const found = LINK_SKILLS.find((l) => l.id === id);
      return found ? `${found.name} (ID: ${id})` : `Custom ID: ${id}`;
    };

    const linkSkillSelectOptionsWithNone = [
      { label: 'None / Clear', value: '' },
      ...LINK_SKILL_SELECT_OPTIONS,
      { label: 'Enter Custom ID...', value: CUSTOM_LINK_ID_VALUE },
    ];
    const categorySelectOptionsWithCustom = [
      { label: 'Select Category...', value: '' },
      ...CATEGORY_SELECT_OPTIONS,
      { label: 'Enter Custom ID...', value: CUSTOM_CATEGORY_ID_VALUE },
    ];
    const passiveSkillSetOptions = [
      { label: 'Use Custom ID', value: 'custom_id' },
      ...(patchState.passiveSkillSets || []).map((ps) => ({
        label: `${ps.id} - ${ps.name}`,
        value: ps.id,
      })),
    ];
    const leaderSkillSetOptions = [
      { label: 'Use Custom ID', value: 'custom_id' },
      ...(patchState.leaderSkillSets || []).map((ls) => ({
        label: `${ls.id} - ${ls.name}`,
        value: ls.id,
      })),
    ];
    const activeSkillSetOptions = (patchState.activeSkillSets || []).map((as) => ({
      label: `${as.id} - ${as.name}`,
      value: as.id,
    }));
    const standbySkillSetOptions = (patchState.standbySkillSets || []).map((ss) => ({
      label: `${ss.id} - ${ss.name}`,
      value: ss.id,
    }));
    const specialSetOptions = (patchState.specialSets || []).map((ss) => ({
      label: `${ss.id} - ${ss.name}`,
      value: ss.id,
    }));

    return (
      <>
        {/* Step 0: Base Stats & Advanced */}
        {(wizardStep === undefined || wizardStep === 0) && (
          <>
            {/* Section: Core Info */}
            <div className="mb-6 pt-4">
          <h4 className="text-lg font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-2">
            Core Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            <FormInput
              label="Card ID"
              value={localCardId}
              onChange={(val) => setLocalCardId(val)}
              onBlur={handleIdBlur}
              placeholder="e.g., 1070001"
              type="text"
            />
            <FormInput
              label="Name"
              value={cardForm.name}
              onChange={(val) => handleChange('name', val)}
            />
            <FormInput
              label="Character ID"
              value={cardForm.character_id}
              onChange={(val) => handleChange('character_id', val)}
            />
            <FormInput
              label="Card Unique Info ID"
              value={cardForm.card_unique_info_id}
              onChange={(val) => handleChange('card_unique_info_id', val)}
            />
            <FormInput
              label="Cost"
              type="number"
              value={cardForm.cost}
              onChange={(val) => handleChange('cost', Number(val))}
            />
            <FormSelect
              label="Rarity"
              value={cardForm.rarity}
              onChange={(val) => handleChange('rarity', Number(val))}
              options={RARITY_TYPE_OPTIONS}
            />
            <FormSelect
              label="Element"
              value={cardForm.element}
              onChange={(val) => handleChange('element', Number(val))}
              options={ELEMENT_TYPE_OPTIONS}
            />
          </div>
        </div>

        {/* Section: Stats */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-2">
            Base Stats
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
            <FormInput
              label="HP Init"
              type="number"
              value={cardForm.hp_init}
              onChange={(val) => handleChange('hp_init', Number(val))}
            />
            <FormInput
              label="HP Max"
              type="number"
              value={cardForm.hp_max}
              onChange={(val) => handleChange('hp_max', Number(val))}
            />
            <FormInput
              label="ATK Init"
              type="number"
              value={cardForm.atk_init}
              onChange={(val) => handleChange('atk_init', Number(val))}
            />
            <FormInput
              label="ATK Max"
              type="number"
              value={cardForm.atk_max}
              onChange={(val) => handleChange('atk_max', Number(val))}
            />
            <FormInput
              label="DEF Init"
              type="number"
              value={cardForm.def_init}
              onChange={(val) => handleChange('def_init', Number(val))}
            />
            <FormInput
              label="DEF Max"
              type="number"
              value={cardForm.def_max}
              onChange={(val) => handleChange('def_max', Number(val))}
            />
          </div>
        </div>

        {/* Advanced Fields Toggle */}
        <div className="text-center my-4">
          <button
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            className="btn-secondary py-2 px-4 text-sm w-full md:w-auto"
          >
            {isAdvancedOpen ? 'Hide' : 'Show'} Advanced & Miscellaneous Fields
            <i
              className={`fas fa-chevron-down ml-2 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
            ></i>
          </button>
        </div>

        {/* Section: Advanced & Miscellaneous Fields */}
        {isAdvancedOpen && (
          <div className="space-y-6 mb-6 p-4 border border-dashed border-[var(--clr-border)] rounded-lg card-inset">
            {/* Levels & Growth */}
            <div>
              <h5 className="text-md font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-1">
                Levels & Growth
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
                <FormInput
                  label="Max Level"
                  type="number"
                  value={cardForm.lv_max}
                  onChange={(val) => handleChange('lv_max', Number(val))}
                />
                <FormInput
                  label="Max Skill Level"
                  type="number"
                  value={cardForm.skill_lv_max}
                  onChange={(val) => handleChange('skill_lv_max', Number(val))}
                />
                <FormInput
                  label="Grow Type"
                  type="number"
                  value={cardForm.grow_type}
                  onChange={(val) => handleChange('grow_type', Number(val))}
                />
                <FormInput
                  label="EXP Type"
                  type="number"
                  value={cardForm.exp_type}
                  onChange={(val) => handleChange('exp_type', Number(val))}
                />
                <FormInput
                  label="Training EXP"
                  type="number"
                  value={cardForm.training_exp}
                  onChange={(val) => handleChange('training_exp', Number(val))}
                />
              </div>
            </div>
            {/* Sales & Rewards */}
            <div>
              <h5 className="text-md font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-1">
                Sales & Rewards
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
                <FormInput
                  label="Price"
                  type="number"
                  value={cardForm.price}
                  onChange={(val) => handleChange('price', Number(val))}
                />
                <FormSelect
                  label="Is Selling Only"
                  value={cardForm.is_selling_only}
                  onChange={(val) => handleChange('is_selling_only', Number(val))}
                  options={[
                    { label: 'No', value: 0 },
                    { label: 'Yes', value: 1 },
                  ]}
                />
                <FormInput
                  label="Collectable Type"
                  type="number"
                  value={cardForm.collectable_type}
                  onChange={(val) => handleChange('collectable_type', Number(val))}
                />
                <FormInput
                  label="Max Lvl Reward ID"
                  value={cardForm.max_level_reward_id}
                  onChange={(val) => handleChange('max_level_reward_id', val)}
                />
                <FormInput
                  label="Max Lvl Reward Type"
                  value={cardForm.max_level_reward_type}
                  onChange={(val) => handleChange('max_level_reward_type', val)}
                />
              </div>
            </div>
            {/* Ki Orb Modifiers */}
            <div>
              <h5 className="text-md font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-1">
                Ki Orb Modifiers
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
                <FormInput
                  label="Eball Mod Min"
                  type="number"
                  value={cardForm.eball_mod_min}
                  onChange={(val) => handleChange('eball_mod_min', Number(val))}
                />
                <FormInput
                  label="Eball Mod Num 100"
                  type="number"
                  value={cardForm.eball_mod_num100}
                  onChange={(val) => handleChange('eball_mod_num100', Number(val))}
                />
                <FormInput
                  label="Eball Mod Mid"
                  type="number"
                  value={cardForm.eball_mod_mid}
                  onChange={(val) => handleChange('eball_mod_mid', Number(val))}
                />
                <FormInput
                  label="Eball Mod Mid Num"
                  type="number"
                  value={cardForm.eball_mod_mid_num}
                  onChange={(val) => handleChange('eball_mod_mid_num', Number(val))}
                />
                <FormInput
                  label="Eball Mod Max"
                  type="number"
                  value={cardForm.eball_mod_max}
                  onChange={(val) => handleChange('eball_mod_max', Number(val))}
                />
                <FormInput
                  label="Eball Mod Max Num"
                  type="number"
                  value={cardForm.eball_mod_max_num}
                  onChange={(val) => handleChange('eball_mod_max_num', Number(val))}
                />
              </div>
            </div>
            {/* Visuals & IDs */}
            <div>
              <h5 className="text-md font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-1">
                Visuals & IDs
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <FormInput
                  label="Special Motion"
                  type="number"
                  value={cardForm.special_motion}
                  onChange={(val) => handleChange('special_motion', Number(val))}
                />
                <FormInput
                  label="Face X"
                  type="number"
                  value={cardForm.face_x}
                  onChange={(val) => handleChange('face_x', Number(val))}
                />
                <FormInput
                  label="Face Y"
                  type="number"
                  value={cardForm.face_y}
                  onChange={(val) => handleChange('face_y', Number(val))}
                />
                <FormInput
                  label="Aura ID"
                  value={cardForm.aura_id || ''}
                  onChange={(val) => handleChange('aura_id', val || null)}
                  placeholder="Optional"
                />
                <FormInput
                  label="Awakening Element"
                  type="number"
                  value={cardForm.awakening_element_type ?? ''}
                  onChange={(val) => handleChange('awakening_element_type', val ? Number(val) : null)}
                  placeholder="Optional"
                />
                <FormInput
                  label="Potential Board ID"
                  value={cardForm.potential_board_id || ''}
                  onChange={(val) => handleChange('potential_board_id', val || null)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        )}
        </>
        )}

        {/* Step 1: Linked Skills & Categories */}
        {(wizardStep === undefined || wizardStep === 1) && (
          <>
            {/* Section: Skill Sets */}
            <div className="mb-6">
          <h4 className="text-lg font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-2">
            Skill Set Links
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SearchableSelect
              label="Passive Skill Set ID"
              value={cardForm.passive_skill_set_id}
              onChange={(val) => handleChange('passive_skill_set_id', val)}
              options={passiveSkillSetOptions}
            />
            <SearchableSelect
              label="Leader Skill Set ID"
              value={cardForm.leader_skill_set_id}
              onChange={(val) => handleChange('leader_skill_set_id', val)}
              options={leaderSkillSetOptions}
            />
            <SearchableSelect
              label="Active Skill Set ID (Ref)"
              value={cardForm.active_skill_set_id_ref || ''}
              onChange={(val) => handleChange('active_skill_set_id_ref', val)}
              options={activeSkillSetOptions}
              isOptional
            />
            {settings.enableStandbyFinishSkills && (
              <SearchableSelect
                label="Standby Skill Set ID (Ref)"
                value={cardForm.standby_skill_set_id_ref || ''}
                onChange={(val) => handleChange('standby_skill_set_id_ref', val)}
                options={standbySkillSetOptions}
                isOptional
              />
            )}
            <FormInput
              label="Optimal Awakening Grow Type"
              value={cardForm.optimal_awakening_grow_type || ''}
              onChange={(val) => handleChange('optimal_awakening_grow_type', val || null)}
              placeholder="e.g., 1025730"
              helpText="Links this card to an EZA definition."
              className="font-roboto-mono md:col-span-2"
            />
          </div>
        </div>

        {/* Section: Link Skills */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-2">
            Link Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {cardForm.link_skill_ids.map((id, idx) =>
              id ? (
                <div key={idx} className="skill-chip">
                  {getLinkSkillDisplayName(id)}
                </div>
              ) : null
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-3">
            {cardForm.link_skill_ids.map((currentLinkIdValue, idx) => {
              const currentId = currentLinkIdValue || '';
              const isPredefined = LINK_SKILL_SELECT_OPTIONS.some(
                (opt) => opt.value === currentId && currentId !== ''
              );
              const displaySelectValue =
                currentId === '' ? '' : isPredefined ? currentId : CUSTOM_LINK_ID_VALUE;
              const showCustomInput = displaySelectValue === CUSTOM_LINK_ID_VALUE;

              return (
                <div key={idx} className="space-y-1">
                  <SearchableSelect
                    label={`Link ${idx + 1}`}
                    value={displaySelectValue}
                    onChange={(newSelectVal) =>
                      handleLinkSkillSelectionChange(idx, String(newSelectVal))
                    }
                    options={linkSkillSelectOptionsWithNone}
                  />
                  {showCustomInput && (
                    <FormInput
                      label={`Custom Link ID ${idx + 1}`}
                      value={currentId}
                      onChange={(customIdVal) => handleListChange('link_skill_ids', idx, customIdVal)}
                      placeholder="Enter Custom Link ID"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Categories */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-2">
            Categories
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {(cardForm.category_ids || []).length > 0 ? (
              (cardForm.category_ids || []).map((catId) => (
                <div key={catId} className="skill-chip">
                  <span>{getCategoryDisplayName(catId)}</span>
                  <button
                    onClick={() => handleRemoveCategory(catId)}
                    className="ml-2 text-[var(--clr-danger)] hover:text-[var(--clr-danger)] hover:brightness-110 text-xs p-1 rounded-full transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--clr-text-muted)] italic">No categories assigned.</p>
            )}
          </div>
          <div className="flex items-end gap-x-3">
            <SearchableSelect
              label="Add Category"
              value={selectedCategoryToAdd}
              onChange={(val) => setSelectedCategoryToAdd(String(val))}
              options={categorySelectOptionsWithCustom}
              className="flex-grow"
            />
            {selectedCategoryToAdd === CUSTOM_CATEGORY_ID_VALUE && (
              <FormInput
                label="Custom ID"
                value={customCategoryId}
                onChange={setCustomCategoryId}
                placeholder="Enter ID"
                className="flex-grow"
              />
            )}
            <button
              onClick={handleAddCategory}
              disabled={
                !selectedCategoryToAdd ||
                (selectedCategoryToAdd === CUSTOM_CATEGORY_ID_VALUE && !customCategoryId.trim())
              }
              className="btn-secondary h-[42px] px-4 rounded-md disabled:opacity-50"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>
        </>
        )}

        {/* Step 2: Special Attacks & Details */}
        {(wizardStep === undefined || wizardStep === 2) && (
          <>
            {/* Section: Special Attacks */}
            <div>
          <h4 className="text-lg font-semibold text-[var(--clr-primary)] mb-3 border-b border-[var(--clr-border)] pb-2">
            Special Attacks
          </h4>
          <div className="space-y-4">
            {cardSpecialsForThisForm.length === 0 && (
              <p className="text-sm text-[var(--clr-text-muted)] italic">
                No special attacks defined.
              </p>
            )}
            {cardSpecialsForThisForm.map((cs, index) => (
              <div key={cs.id} className="card p-4 border-[var(--clr-border)]">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-[var(--clr-text-accent)]">
                    Special Attack {index + 1}{' '}
                    <span className="text-xs text-[var(--clr-text-muted)] font-roboto-mono">
                      (Row ID: {cs.id})
                    </span>
                  </p>
                  <button
                    onClick={() => handleRemoveCardSpecial(index)}
                    className="btn-danger text-xs py-1 px-2 rounded-md"
                  >
                    <i className="fas fa-times mr-1"></i>Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                  <FormInput
                    label="Row ID (card_specials)"
                    value={cs.id}
                    onChange={(val) => handleUpdateCardSpecial(index, 'id', val)}
                  />
                  <SearchableSelect
                    label="Special Set ID"
                    value={cs.special_set_id}
                    onChange={(val) => handleUpdateCardSpecial(index, 'special_set_id', val)}
                    options={specialSetOptions}
                    isOptional
                  />
                  <FormInput
                    label="Style (e.g. Normal)"
                    value={cs.style}
                    onChange={(val) => handleUpdateCardSpecial(index, 'style', val)}
                  />
                  <FormInput
                    label="Priority"
                    type="number"
                    value={cs.priority}
                    onChange={(val) => handleUpdateCardSpecial(index, 'priority', Number(val))}
                  />
                  <FormInput
                    label="SA Lvl Start"
                    type="number"
                    value={cs.lv_start}
                    onChange={(val) => handleUpdateCardSpecial(index, 'lv_start', Number(val))}
                  />
                  <FormInput
                    label="Ki Required"
                    type="number"
                    value={cs.eball_num_start}
                    onChange={(val) => handleUpdateCardSpecial(index, 'eball_num_start', Number(val))}
                  />
                  <FormInput
                    label="View ID"
                    type="number"
                    value={cs.view_id}
                    onChange={(val) => handleUpdateCardSpecial(index, 'view_id', Number(val))}
                  />
                  <FormInput
                    label="Costume Condition ID"
                    type="number"
                    value={cs.card_costume_condition_id}
                    onChange={(val) =>
                      handleUpdateCardSpecial(index, 'card_costume_condition_id', Number(val))
                    }
                  />
                  <FormInput
                    label="Special Asset ID"
                    value={cs.special_asset_id || ''}
                    onChange={(val) =>
                      handleUpdateCardSpecial(index, 'special_asset_id', val || null)
                    }
                    placeholder="Optional"
                  />
                  {settings.enableVisualCausalityEditor ? (
                    <div className="lg:col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-[var(--clr-text-muted)] mb-1">
                        Causality Conditions
                      </label>
                      <CausalityEditor
                        jsonString={cs.causality_conditions || ''}
                        onChange={(val) =>
                          handleUpdateCardSpecial(index, 'causality_conditions', val || null)
                        }
                        skillCausalities={skillCausalities || []}
                        onCreateSkillCausality={onCreateSkillCausality}
                        isDbLoaded={!!dbInstance}
                        onFetchSkillCausality={onFetchSkillCausality}
                      />
                    </div>
                  ) : (
                    <FormTextArea
                      label="Causality Conditions (JSON)"
                      value={cs.causality_conditions || ''}
                      onChange={(val) =>
                        handleUpdateCardSpecial(index, 'causality_conditions', val || null)
                      }
                      rows={2}
                      className="lg:col-span-4 md:col-span-2"
                    />
                  )}
                  <div className="lg:col-span-4 md:col-span-2">
                    <button
                      onClick={() =>
                        setExpandedBonuses((prev) => ({ ...prev, [cs.id]: !prev[cs.id] }))
                      }
                      className="text-sm text-[var(--clr-primary)] hover:text-[var(--clr-accent)] mb-2"
                    >
                      {expandedBonuses[cs.id] ? 'Hide' : 'Show'} Special Bonuses{' '}
                      <i
                        className={`fas fa-chevron-down text-xs transition-transform ${expandedBonuses[cs.id] ? 'rotate-180' : ''}`}
                      ></i>
                    </button>
                    {expandedBonuses[cs.id] && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 p-3 card-inset rounded-md">
                        <FormInput
                          label="Bonus ID 1"
                          type="number"
                          value={cs.special_bonus_id1}
                          onChange={(val) =>
                            handleUpdateCardSpecial(index, 'special_bonus_id1', Number(val))
                          }
                        />
                        <FormInput
                          label="Bonus Lvl 1"
                          type="number"
                          value={cs.special_bonus_lv1}
                          onChange={(val) =>
                            handleUpdateCardSpecial(index, 'special_bonus_lv1', Number(val))
                          }
                        />
                        <FormInput
                          label="Bonus View ID 1"
                          type="number"
                          value={cs.bonus_view_id1}
                          onChange={(val) =>
                            handleUpdateCardSpecial(index, 'bonus_view_id1', Number(val))
                          }
                        />
                        <FormInput
                          label="Bonus ID 2"
                          type="number"
                          value={cs.special_bonus_id2}
                          onChange={(val) =>
                            handleUpdateCardSpecial(index, 'special_bonus_id2', Number(val))
                          }
                        />
                        <FormInput
                          label="Bonus Lvl 2"
                          type="number"
                          value={cs.special_bonus_lv2}
                          onChange={(val) =>
                            handleUpdateCardSpecial(index, 'special_bonus_lv2', Number(val))
                          }
                        />
                        <FormInput
                          label="Bonus View ID 2"
                          type="number"
                          value={cs.bonus_view_id2}
                          onChange={(val) =>
                            handleUpdateCardSpecial(index, 'bonus_view_id2', Number(val))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddCardSpecial}
            className="mt-4 w-full btn-secondary py-2 rounded-md text-sm"
          >
            <i className="fas fa-plus mr-2"></i> Add Special Attack Entry
          </button>
        </div>
      </>
      )}
      </>
    );
  };

export const CharacterFormEditor: React.FC<CharacterFormEditorProps> = (props) => {
  return (
    <div className="pr-2">
      <EditorContent {...props} />
    </div>
  );
};
